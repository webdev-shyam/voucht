"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/components/ui/use-toast";

interface MilestoneFormProps {
  projectId: string;
  onSuccess?: () => void;
}

export function MilestoneForm({ projectId, onSuccess }: MilestoneFormProps) {
  const addMilestone = useAppStore((state) => state.addMilestone);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !dueDate) {
      toast({
        title: "Missing fields",
        description: "Please fill in title, amount, and due date.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    addMilestone(projectId, {
      title,
      description,
      amount: parseFloat(amount) || 0,
      dueDate,
      status: "pending",
    });

    toast({
      title: "Milestone Added",
      description: `"${title}" was added to project milestones.`,
      variant: "success",
    });

    setTitle("");
    setDescription("");
    setAmount("");
    setDueDate("");
    setLoading(false);
    if (onSuccess) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="msTitle" className="text-white">Milestone Title *</Label>
        <Input
          id="msTitle"
          placeholder="e.g. Beta release & QA Testing"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="msDesc" className="text-white">Description & Deliverables</Label>
        <Textarea
          id="msDesc"
          placeholder="Describe deliverables, test plan, or git tag URL..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 min-h-[80px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="msAmt" className="text-white">Amount ($) *</Label>
          <Input
            id="msAmt"
            type="number"
            placeholder="3500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="msDate" className="text-white">Due Date *</Label>
          <Input
            id="msDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className="mt-1"
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <Button type="submit" variant="electric" size="sm" disabled={loading}>
          {loading ? "Adding..." : "Add Milestone"}
        </Button>
      </div>
    </form>
  );
}
