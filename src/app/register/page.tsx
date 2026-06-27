"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { registerUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"STUDENT" | "ALUMNI">("STUDENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "STUDENT" },
  });

  const onRoleChange = (value: string) => {
    const r = value as "STUDENT" | "ALUMNI";
    setRole(r);
    setValue("role", r);
  };

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    setError("");
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined) formData.append(k, String(v));
    });

    const result = await registerUser(formData);
    if (!result.success) {
      setError(result.error || "Registration failed");
      setLoading(false);
      return;
    }
    router.push("/login?registered=true");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Join the Alumni Network community</CardDescription>
        </CardHeader>

        <Tabs value={role} onValueChange={onRoleChange}>
          <TabsList className="mx-6 grid w-auto grid-cols-2">
            <TabsTrigger value="STUDENT">Current Student</TabsTrigger>
            <TabsTrigger value="ALUMNI">Alumni</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" {...register("role")} value={role} />
            <CardContent className="space-y-4 pt-4">
              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input {...register("name")} placeholder="Your full name" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" {...register("email")} placeholder="you@example.com" />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" {...register("password")} />
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input type="password" {...register("confirmPassword")} />
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Input {...register("department")} placeholder="e.g. Computer Science" />
                {errors.department && <p className="text-sm text-destructive">{errors.department.message}</p>}
              </div>

              <TabsContent value="STUDENT" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label>Expected Graduation Batch</Label>
                  <Input {...register("batch")} placeholder="e.g. 2026" />
                </div>
                <div className="space-y-2">
                  <Label>Career Goals (comma separated)</Label>
                  <Input {...register("careerGoals")} placeholder="Software Engineer, Data Scientist" />
                </div>
                <div className="space-y-2">
                  <Label>Interests (comma separated)</Label>
                  <Input {...register("interests")} placeholder="AI, Web Development" />
                </div>
              </TabsContent>

              <TabsContent value="ALUMNI" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label>Graduation Batch *</Label>
                  <Input {...register("batch")} placeholder="e.g. 2018" />
                  {errors.batch && <p className="text-sm text-destructive">{errors.batch.message}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input {...register("company")} placeholder="Current company" />
                  </div>
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Input {...register("position")} placeholder="Job title" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Alumni accounts require admin verification before accessing directory and mentorship features.
                </p>
              </TabsContent>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">Sign in</Link>
              </p>
            </CardFooter>
          </form>
        </Tabs>
      </Card>
    </div>
  );
}
