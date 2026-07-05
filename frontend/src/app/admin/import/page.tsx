"use client";

import { useState, useRef } from "react";
import { importAlumniRecords, type ImportRecord } from "@/actions/import";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Table } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ImportAlumniPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewRecords, setPreviewRecords] = useState<ImportRecord[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Robust CSV parser supporting quotes and multiple header variations
  function parseCSV(text: string): ImportRecord[] {
    const lines = text.split(/\r?\n/);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/["']/g, ""));
    const records: ImportRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle simple CSV splitting (supporting quoted commas)
      const values: string[] = [];
      let currentVal = "";
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(currentVal.trim().replace(/^["']|["']$/g, ""));
          currentVal = "";
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim().replace(/^["']|["']$/g, ""));

      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        const val = values[index] || "";
        if (header.includes("name")) record.name = val;
        else if (header.includes("batch") || header.includes("year")) record.batch = val;
        else if (header.includes("dept") || header.includes("department")) record.department = val;
        else if (header.includes("company") || header.includes("org")) record.company = val;
        else if (header.includes("pos") || header.includes("position") || header.includes("title")) record.position = val;
        else if (header.includes("email")) record.email = val;
        else if (header.includes("linkedin") || header.includes("url")) record.linkedin = val;
      });

      if (record.name && record.batch && record.department) {
        records.push(record as ImportRecord);
      }
    }
    return records;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setParsing(true);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setPreviewRecords(parsed);
      setParsing(false);
      if (parsed.length === 0) {
        setMessage({
          type: "error",
          text: "No valid records found in the CSV. Make sure headers contain: name, batch, department.",
        });
      }
    };
    reader.onerror = () => {
      setMessage({ type: "error", text: "Error reading file." });
      setParsing(false);
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (previewRecords.length === 0) return;
    setImporting(true);
    setMessage(null);

    const res = await importAlumniRecords(previewRecords);
    if (res.success) {
      setMessage({ type: "success", text: res.message || "Import complete!" });
      setPreviewRecords([]);
      setFile(null);
    } else {
      setMessage({ type: "error", text: res.error || "Import failed." });
    }
    setImporting(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Alumni Database</h1>
        <p className="text-muted-foreground mt-1">Upload CSV database files from Chitkara University to register approved alumni.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Upload Zone */}
        <Card className="md:col-span-1 shadow-md">
          <CardHeader>
            <CardTitle>File Upload</CardTitle>
            <CardDescription>Select a CSV database file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/40 transition-colors"
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm font-semibold">Click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Only .csv files are supported</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv"
                onChange={handleFileChange}
              />
            </div>

            {file && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            )}

            {message && (
              <div className={`p-4 rounded-xl border flex gap-3 text-sm ${
                message.type === "success" 
                  ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                  : "bg-destructive/5 border-destructive/10 text-destructive"
              }`}>
                {message.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{message.text}</span>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full h-11 rounded-xl shadow-lg shadow-primary/10" 
              disabled={importing || parsing || previewRecords.length === 0}
              onClick={handleImport}
            >
              {importing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" /> Importing...
                </>
              ) : (
                "Import Records"
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Database Format Info */}
        <Card className="md:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle>CSV Specifications</CardTitle>
            <CardDescription>Verify your file format aligns with the fields below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>The import utility maps headers automatically. Ensure your CSV file includes these headers:</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-xl">
                <span className="font-semibold block">Required Headers:</span>
                <span className="text-xs text-muted-foreground mt-1 block">
                  <code>name</code>, <code>batch</code> (e.g. 2018), <code>department</code>
                </span>
              </div>
              <div className="p-3 border rounded-xl">
                <span className="font-semibold block">Optional Headers:</span>
                <span className="text-xs text-muted-foreground mt-1 block">
                  <code>company</code>, <code>position</code>, <code>email</code>, <code>linkedin</code>
                </span>
              </div>
            </div>
            
            <div className="p-3 rounded-xl bg-muted/60 font-mono text-[10px] whitespace-pre overflow-x-auto border">
{`name,batch,department,company,position,email,linkedin
"Rohan Sharma",2019,"Computer Science","Google","Software Engineer",rohan@gmail.com,https://linkedin.com/in/rohan
"Mehak Gupta",2020,"Electronics","Apple","Hardware Engineer",mehak@apple.com,
"Aman Verma",2018,"Mechanical","Tata Motors","Design Lead",,https://linkedin.com/in/aman`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Table */}
      {previewRecords.length > 0 && (
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5 text-primary" /> Data Preview
              </CardTitle>
              <CardDescription>Showing records parsed from file. Verify before executing import.</CardDescription>
            </div>
            <Badge variant="secondary" className="px-3 py-1 font-bold">
              {previewRecords.length} Record{previewRecords.length !== 1 ? "s" : ""} Found
            </Badge>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider">Name</th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider">Batch</th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider">Department</th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider">Company</th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider">Position</th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider">Email</th>
                </tr>
              </thead>
              <tbody>
                {previewRecords.slice(0, 10).map((rec, index) => (
                  <tr key={index} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{rec.name}</td>
                    <td className="p-3">{rec.batch}</td>
                    <td className="p-3">{rec.department}</td>
                    <td className="p-3 text-muted-foreground">{rec.company || "N/A"}</td>
                    <td className="p-3 text-muted-foreground">{rec.position || "N/A"}</td>
                    <td className="p-3 text-xs text-muted-foreground font-mono">{rec.email || "Auto-Generated"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewRecords.length > 10 && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                And {previewRecords.length - 10} more records...
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
