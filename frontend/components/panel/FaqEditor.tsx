"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { Plus, Trash2, GripVertical } from "lucide-react";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface FaqEditorProps {
  value: FaqItem[];
  onChange: (faqs: FaqItem[]) => void;
  categories: string[];
}

export function FaqEditor({ value, onChange, categories }: FaqEditorProps) {
  const addFaq = () => {
    onChange([
      ...value,
      {
        id: crypto.randomUUID(),
        question: "",
        answer: "",
        category: categories[0] || "general",
      },
    ]);
  };

  const removeFaq = (index: number) => {
    const updated = [...value];
    updated.splice(index, 1);
    onChange(updated);
  };

  const updateFaq = (index: number, field: keyof FaqItem, newValue: string) => {
    const updated = [...value];
    // اطمینان از اینکه هر Faq یک id یکتا دارد
    if (!updated[index].id) {
      updated[index].id = crypto.randomUUID();
    }
    updated[index] = { ...updated[index], [field]: newValue };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {value.map((faq, idx) => (
        <motion.div
          key={faq.id || idx} // ← رفع خطای unique key
          className="border rounded-xl p-4 bg-background space-y-3 relative"
        >
          <div className="absolute left-2 top-2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:bg-destructive/10"
              onClick={() => removeFaq(idx)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            <div className="sm:col-span-3 space-y-1.5">
              <Label className="text-xs">سوال</Label>
              <Input
                value={faq.question}
                onChange={(e) => updateFaq(idx, "question", e.target.value)}
                placeholder="متن سوال"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">دسته‌بندی</Label>
              <Select
                value={faq.category}
                onValueChange={(val) => updateFaq(idx, "category", val)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">پاسخ</Label>
            <Textarea
              value={faq.answer}
              onChange={(e) => updateFaq(idx, "answer", e.target.value)}
              placeholder="متن پاسخ"
              rows={3}
            />
          </div>
        </motion.div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 mt-2"
        onClick={addFaq}
      >
        <Plus className="w-4 h-4" />
        افزودن سوال جدید
      </Button>
    </div>
  );
}
