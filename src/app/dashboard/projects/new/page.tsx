"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  FolderPlus,
  Info,
  Layers,
  Mail,
  Plus,
  Send,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency, canAccess } from "@/lib/utils";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";

// Zod Schema
const milestoneSchema = z.object({
  title: z.string().min(2, "Milestone title is required"),
  dueDate: z.string().min(1, "Milestone due date is required"),
  amount: z.number(),
});

const newProjectSchema = z.object({
  title: z.string().min(3, "Project title must be at least 3 characters"),
  description: z.string().optional(),
  clientName: z.string().min(2, "Client name is required"),
  clientEmail: z.string().email("Valid client email is required"),
  paymentAmount: z.number().min(0),
  currency: z.enum(["USD", "EUR", "GBP"]),
  deadline: z.string().min(1, "Deadline is required"),
  milestones: z
    .array(milestoneSchema)
    .min(1, "At least one milestone is required"),
  sendEmailToClient: z.boolean(),
});

type NewProjectFormValues = z.infer<typeof newProjectSchema>;

export default function NewProjectPage() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const projects = useAppStore((state) => state.projects);
  const addProject = useAppStore((state) => state.addProject);
  const logActivity = useAppStore((state) => state.logActivity);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const activeProjects = projects.filter((p) => p.status === "active");
  const isLimitReached = !canAccess(user.tier, "unlimited_projects") && activeProjects.length >= 1;

  // Setup default future dates
  const today = new Date();
  const defaultDeadline = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const defaultMilestoneDue = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const form = useForm<NewProjectFormValues>({
    resolver: zodResolver(newProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      clientName: "",
      clientEmail: "",
      paymentAmount: 1500,
      currency: "USD",
      deadline: defaultDeadline,
      sendEmailToClient: true,
      milestones: [
        {
          title: "Initial Deliverable & Architecture",
          dueDate: defaultMilestoneDue,
          amount: 750,
        },
      ],
    },
    mode: "onChange",
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = form;

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "milestones",
  });

  const formValues = watch();
  const currentDeadline = watch("deadline");

  // Step 1 -> Step 2 validation
  const handleNextStep1 = async () => {
    const valid = await trigger([
      "title",
      "clientName",
      "clientEmail",
      "deadline",
      "paymentAmount",
      "currency",
    ]);
    if (valid) {
      setStep(2);
    }
  };

  // Step 2 -> Step 3 validation
  const handleNextStep2 = async () => {
    const valid = await trigger("milestones");
    if (!valid) return;

    // Check that milestones are before project deadline
    if (currentDeadline) {
      const deadlineDate = new Date(currentDeadline).getTime();
      for (let i = 0; i < formValues.milestones.length; i++) {
        const ms = formValues.milestones[i];
        if (new Date(ms.dueDate).getTime() > deadlineDate) {
          toast({
            title: "Milestone Date Error",
            description: `Milestone "${ms.title}" due date cannot be after the project deadline (${currentDeadline}).`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    setStep(3);
  };

  // Submit Handler
  const onSubmit = async (data: NewProjectFormValues) => {
    setSubmitting(true);
    try {
      const totalBudget = data.paymentAmount || 0;
      const initialToken = `tok_${Math.random().toString(36).substring(2, 12)}`;

      // 1. Insert into projects with all milestones
      const createdProject = addProject({
        title: data.title,
        description: data.description,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        totalBudget,
        currency: data.currency,
        startDate: new Date().toISOString().split("T")[0],
        deadline: data.deadline,
        status: "active",
        clientConfirmed: false,
        milestones: data.milestones.map((m, idx) => ({
          id: `ms_${Date.now()}_${idx}`,
          projectId: "",
          title: m.title,
          description: m.title,
          dueDate: m.dueDate,
          amount: m.amount || totalBudget / data.milestones.length,
          status: "pending",
          verificationToken: idx === 0 ? initialToken : `tok_${Math.random().toString(36).substring(2, 12)}`,
        })),
      });

      // 2. Dispatch email to client if checkbox selected
      if (data.sendEmailToClient) {
        try {
          await fetch("/api/email/send-client-confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: data.clientEmail,
              clientName: data.clientName,
              freelancerName: user.fullName,
              projectTitle: data.title,
              milestoneTitle: data.milestones[0]?.title || "Project Milestone Kickoff",
              token: initialToken,
            }),
          });
        } catch (emailErr) {
          console.warn("Client email dispatch skipped or non-fatal:", emailErr);
        }
      }

      // 3. Log activity: "Created project '{title}'"
      logActivity({
        title: `Created project '${data.title}'`,
        description: `Initialized project with ${data.milestones.length} milestones for client ${data.clientName}.`,
        type: "project_created",
      });

      // 4. Show success toast
      toast({
        title: "Project created successfully! 🎉",
        description: `Project "${data.title}" is now active in your dashboard.`,
      });

      // 5. Redirect to /dashboard/projects/[id]
      router.push(`/dashboard/projects/${createdProject.id}`);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Failed to create project",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  if (isLimitReached) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/projects")}
          className="text-textSecondary hover:text-white -ml-2 gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Button>

        <Card className="border border-electric/30 bg-surface p-8 text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-electric/15 border border-electric/30 flex items-center justify-center text-electric mx-auto mb-4">
            <FolderPlus className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Active Project Limit Reached (Free Tier)
          </h2>
          <p className="text-xs text-textSecondary max-w-md mx-auto mb-6 leading-relaxed">
            The Free starter plan allows 1 active concurrent project. Upgrade to Freelancer Pro ($10/mo) or Elite ($29/mo) to manage unlimited client contracts, automated milestone reminders, and dynamic SVG badges.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/projects")}
              className="w-full sm:w-auto text-xs border-surfaceLight text-textSecondary"
            >
              View Active Project
            </Button>
            <Button
              variant="electric"
              onClick={() => setShowUpgradeModal(true)}
              className="w-full sm:w-auto font-bold text-xs shadow-md"
            >
              <span>Upgrade to Pro — $10/mo →</span>
            </Button>
          </div>
        </Card>

        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          feature="unlimited_projects"
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6 pb-16">
      {/* Top Breadcrumb / Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/dashboard/projects")}
        className="text-textSecondary hover:text-white -ml-2 gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Projects</span>
      </Button>

      {/* Stepper Header */}
      <div className="rounded-2xl border border-surfaceLight bg-surface p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surfaceLight pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <FolderPlus className="w-6 h-6 text-electric" />
              <span>Create New Project</span>
            </h1>
            <p className="text-xs text-textSecondary mt-1">
              Initialize your verifiable SLA milestone contract in 3 simple steps.
            </p>
          </div>

          <Badge variant="electric" className="text-xs font-mono py-1 px-3 w-fit">
            Step {step} of 3
          </Badge>
        </div>

        {/* Visual Step Progress Bar */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          <div
            className={`h-1.5 rounded-full transition-all ${
              step >= 1 ? "bg-electric" : "bg-navyLight"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all ${
              step >= 2 ? "bg-electric" : "bg-navyLight"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all ${
              step >= 3 ? "bg-electric" : "bg-navyLight"
            }`}
          />
        </div>

        <div className="grid grid-cols-3 text-center text-xs mt-2 font-mono text-textSecondary">
          <span className={step === 1 ? "text-electric font-bold" : ""}>
            1. Details
          </span>
          <span className={step === 2 ? "text-electric font-bold" : ""}>
            2. Milestones
          </span>
          <span className={step === 3 ? "text-electric font-bold" : ""}>
            3. Review & Launch
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ================= STEP 1: PROJECT DETAILS ================= */}
        {step === 1 && (
          <Card className="border-surfaceLight bg-surface shadow-xl">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <span>Step 1 — Project Details</span>
              </CardTitle>
              <CardDescription className="text-xs text-textSecondary">
                Specify your engagement parameters, client info, and contractual deadline.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-0 space-y-5">
              {/* Project Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold text-slate-200">
                  Project Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Next.js SaaS Web App & API Redesign"
                  className="bg-navyLight border-surfaceLight text-white h-11 focus:border-electric"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-xs text-red-400 font-medium">{errors.title.message}</p>
                )}
              </div>

              {/* Description (optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-semibold text-slate-200">
                  Project Scope / Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Briefly describe key deliverables, tech stack, and scope..."
                  className="bg-navyLight border-surfaceLight text-white focus:border-electric text-sm"
                  {...register("description")}
                />
              </div>

              {/* Client Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="clientName" className="text-xs font-semibold text-slate-200">
                    Client Full Name *
                  </Label>
                  <div className="relative">
                    <User className="w-4 h-4 text-textSecondary absolute left-3.5 top-3.5" />
                    <Input
                      id="clientName"
                      placeholder="e.g. Sarah Jenkins"
                      className="pl-10 bg-navyLight border-surfaceLight text-white h-11 focus:border-electric"
                      {...register("clientName")}
                    />
                  </div>
                  {errors.clientName && (
                    <p className="text-xs text-red-400 font-medium">
                      {errors.clientName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="clientEmail" className="text-xs font-semibold text-slate-200">
                    Client Email (for verification sign-off) *
                  </Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-textSecondary absolute left-3.5 top-3.5" />
                    <Input
                      id="clientEmail"
                      type="email"
                      placeholder="sarah@clientcorp.io"
                      className="pl-10 bg-navyLight border-surfaceLight text-white h-11 focus:border-electric"
                      {...register("clientEmail")}
                    />
                  </div>
                  {errors.clientEmail && (
                    <p className="text-xs text-red-400 font-medium">
                      {errors.clientEmail.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Amount, Currency, and Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="paymentAmount" className="text-xs font-semibold text-slate-200">
                    Payment Amount
                  </Label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-textSecondary absolute left-3 top-3.5" />
                    <Input
                      id="paymentAmount"
                      type="number"
                      placeholder="1500"
                      className="pl-9 bg-navyLight border-surfaceLight text-white h-11 focus:border-electric font-mono"
                      {...register("paymentAmount", { valueAsNumber: true })}
                    />
                  </div>
                  {errors.paymentAmount && (
                    <p className="text-xs text-red-400 font-medium">
                      {errors.paymentAmount.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-200">Currency</Label>
                  <Select
                    defaultValue="USD"
                    onValueChange={(val: "USD" | "EUR" | "GBP") => setValue("currency", val)}
                  >
                    <SelectTrigger className="bg-navyLight border-surfaceLight text-white h-11">
                      <SelectValue placeholder="USD" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-surfaceLight text-white">
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="deadline" className="text-xs font-semibold text-slate-200">
                    Project Final Deadline *
                  </Label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-textSecondary absolute left-3 top-3.5 pointer-events-none" />
                    <Input
                      id="deadline"
                      type="date"
                      className="pl-9 bg-navyLight border-surfaceLight text-white h-11 focus:border-electric"
                      {...register("deadline")}
                    />
                  </div>
                  {errors.deadline && (
                    <p className="text-xs text-red-400 font-medium">
                      {errors.deadline.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-surfaceLight flex justify-end">
                <Button
                  type="button"
                  variant="electric"
                  onClick={handleNextStep1}
                  className="font-bold gap-2 px-6 h-10"
                >
                  <span>Next: Define Milestones</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ================= STEP 2: MILESTONES ================= */}
        {step === 2 && (
          <Card className="border-surfaceLight bg-surface shadow-xl">
            <CardHeader className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-electric" />
                    <span>Step 2 — Milestone Breakdown</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-textSecondary mt-0.5">
                    Break this project into verifiable checkpoints. Client confirms each delivery.
                  </CardDescription>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      title: `Milestone ${fields.length + 1}`,
                      dueDate: currentDeadline || defaultMilestoneDue,
                      amount: 0,
                    })
                  }
                  className="border-surfaceLight hover:border-electric hover:text-white text-xs gap-1.5 h-8 font-semibold shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-electric" />
                  <span>+ Add Milestone</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 pt-0 space-y-4">
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 rounded-xl bg-navyLight/80 border border-surfaceLight space-y-3 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-surface border border-surfaceLight flex items-center justify-center text-xs font-mono font-bold text-electric">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-textSecondary">
                          Milestone {index + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Up / Down reordering */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={index === 0}
                          onClick={() => move(index, index - 1)}
                          className="h-7 w-7 text-textSecondary hover:text-white"
                          title="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={index === fields.length - 1}
                          onClick={() => move(index, index + 1)}
                          className="h-7 w-7 text-textSecondary hover:text-white"
                          title="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </Button>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            title="Remove milestone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-7 space-y-1">
                        <Label className="text-[11px] text-textSecondary">Milestone Title *</Label>
                        <Input
                          placeholder="e.g. Wireframes, Frontend Integration"
                          className="bg-surface border-surfaceLight text-white h-9 text-xs focus:border-electric"
                          {...register(`milestones.${index}.title` as const)}
                        />
                        {errors.milestones?.[index]?.title && (
                          <p className="text-[11px] text-red-400">
                            {errors.milestones[index]?.title?.message}
                          </p>
                        )}
                      </div>

                      <div className="sm:col-span-5 space-y-1">
                        <Label className="text-[11px] text-textSecondary">
                          Due Date (before {currentDeadline || "deadline"}) *
                        </Label>
                        <Input
                          type="date"
                          max={currentDeadline}
                          className="bg-surface border-surfaceLight text-white h-9 text-xs focus:border-electric"
                          {...register(`milestones.${index}.dueDate` as const)}
                        />
                        {errors.milestones?.[index]?.dueDate && (
                          <p className="text-[11px] text-red-400">
                            {errors.milestones[index]?.dueDate?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-surface border border-surfaceLight flex items-start gap-2.5 text-xs text-textSecondary">
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <p>
                  Each milestone will be issued an individual one-click verification link for your client.
                  Milestone deliveries submitted on or before due date increase your On-Time Score.
                </p>
              </div>

              <div className="pt-4 border-t border-surfaceLight flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-surfaceLight text-xs gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Details</span>
                </Button>

                <Button
                  type="button"
                  variant="electric"
                  onClick={handleNextStep2}
                  className="font-bold gap-2 px-6 h-10"
                >
                  <span>Next: Review & Launch</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ================= STEP 3: REVIEW & CREATE ================= */}
        {step === 3 && (
          <Card className="border-surfaceLight bg-surface shadow-xl">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-electric" />
                <span>Step 3 — Review & Launch Agreement</span>
              </CardTitle>
              <CardDescription className="text-xs text-textSecondary">
                Review your contract summary before launching the live milestone tracker.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-0 space-y-6">
              {/* Summary of Project Details */}
              <div className="p-4 rounded-xl bg-navyLight border border-surfaceLight space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-textSecondary">
                      Project
                    </span>
                    <h3 className="text-base font-bold text-white">{formValues.title}</h3>
                    {formValues.description && (
                      <p className="text-xs text-textSecondary mt-0.5">{formValues.description}</p>
                    )}
                  </div>
                  <span className="text-lg font-bold font-mono text-electric">
                    {formatCurrency(formValues.paymentAmount || 0, formValues.currency)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-surfaceLight text-xs">
                  <div>
                    <span className="text-textSecondary block text-[11px]">Client:</span>
                    <span className="font-semibold text-white">{formValues.clientName}</span>
                  </div>
                  <div>
                    <span className="text-textSecondary block text-[11px]">Client Email:</span>
                    <span className="font-semibold text-white truncate block">
                      {formValues.clientEmail}
                    </span>
                  </div>
                  <div>
                    <span className="text-textSecondary block text-[11px]">Final Deadline:</span>
                    <span className="font-semibold text-white">{formValues.deadline}</span>
                  </div>
                </div>
              </div>

              {/* Milestones Summary */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-textSecondary mb-2">
                  Milestones ({formValues.milestones.length})
                </h4>
                <div className="space-y-2">
                  {formValues.milestones.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-surface border border-surfaceLight flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-navyLight text-electric font-mono font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-white">{m.title}</span>
                      </div>
                      <span className="text-textSecondary font-mono">
                        Due: {m.dueDate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checkbox: Send confirmation email to client */}
              <div className="p-4 rounded-xl bg-navyLight/80 border border-surfaceLight flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-surface border border-surfaceLight text-electric">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      Send confirmation email to client
                    </p>
                    <p className="text-[11px] text-textSecondary">
                      Dispatches kickoff milestone sign-off invitation to {formValues.clientEmail}.
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  id="sendEmail"
                  className="w-4 h-4 accent-[#00ff88] rounded cursor-pointer"
                  {...register("sendEmailToClient")}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-surfaceLight flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="border-surfaceLight text-xs gap-1.5"
                  disabled={submitting}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Milestones</span>
                </Button>

                <Button
                  type="submit"
                  variant="electric"
                  disabled={submitting}
                  className="font-bold gap-2 px-8 h-11 text-sm shadow-lg"
                >
                  {submitting ? (
                    <span>Launching Project...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Create Project</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
