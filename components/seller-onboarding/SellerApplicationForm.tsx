"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { submitSellerApplication } from "@/services/sellerApplicationService";
import {
  sellerApplicationSchema,
  splitCategories,
  type SellerApplicationFormInput,
} from "@/utils/sellerApplicationValidation";

interface Props {
  uid: string;
  email: string;
  onSubmitted: (id: string) => void;
}

const fieldClass =
  "min-h-12 w-full rounded-sm border border-gray-300 bg-ivory-50 px-4 py-3 text-body text-black-900 transition duration-base ease-luxury placeholder:text-gray-500 focus:border-gold-500 focus:outline-none";

export function SellerApplicationForm({
  uid,
  email,
  onSubmitted,
}: Props): React.JSX.Element {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SellerApplicationFormInput>({
    resolver: zodResolver(sellerApplicationSchema),
    defaultValues: {
      email,
      instagram: "",
      expectedMonthlyCapacity: "10",
    },
  });

  const submit = handleSubmit(async (rawValues) => {
    const parsed = sellerApplicationSchema.safeParse(rawValues);

    if (!parsed.success) {
      setError("Please review the highlighted fields and try again.");
      return;
    }

    if (files.length === 0) {
      setError("Add at least one portfolio image.");
      return;
    }

    setError(null);
    setSubmitting(true);
    setStage("Saving your application details...");

    try {
      const values = parsed.data;

      const id = await submitSellerApplication(
        uid,
        {
          fullName: values.fullName.trim(),
          studioName: values.studioName.trim(),
          email: values.email.trim(),
          mobile: values.mobile.trim(),
          city: values.city.trim(),
          state: values.state.trim(),
          instagram: values.instagram?.trim() || null,
          experience: values.experience.trim(),
          productCategories: splitCategories(values.productCategories),
          whyJoin: values.whyJoin.trim(),
          expectedMonthlyCapacity: Number(
            values.expectedMonthlyCapacity,
          ),
        },
        files,
        setStage,
      );

      setStage("Application submitted. Opening your tracking page...");
      onSubmitted(id);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The request could not be submitted.",
      );
      setStage(null);
    } finally {
      setSubmitting(false);
    }
  });

  const field = (
    name: keyof SellerApplicationFormInput,
    label: string,
    type: "text" | "email" | "tel" | "url" | "number" = "text",
    readOnly = false,
  ) => (
    <label className="grid gap-2 text-caption font-semibold text-black-900">
      {label}
      <input
        className={fieldClass}
        type={type}
        readOnly={readOnly}
        {...register(name)}
        aria-invalid={Boolean(errors[name])}
      />
      {errors[name]?.message ? (
        <span className="text-micro font-normal text-error">
          {String(errors[name]?.message)}
        </span>
      ) : null}
    </label>
  );

  return (
    <form className="grid gap-6" onSubmit={submit} noValidate>
      {error ? <ErrorState message={error} /> : null}

      <Card className="grid gap-5 sm:grid-cols-2">
        {field("fullName", "Full name")}
        {field("studioName", "Studio name")}
        {field("email", "Email", "email", true)}
        {field("mobile", "Mobile", "tel")}
        {field("city", "City")}
        {field("state", "State")}
        {field("instagram", "Instagram profile (optional)", "url")}
        {field(
          "expectedMonthlyCapacity",
          "Expected monthly capacity",
          "number",
        )}
      </Card>

      <Card className="grid gap-5">
        <label className="grid gap-2 text-caption font-semibold">
          Experience
          <span className="font-normal text-gray-700">
            (example: 2 or 2 years making resin art)
          </span>
          <input
            inputMode="text"
            placeholder="2 years making resin art"
            className={fieldClass}
            {...register("experience")}
          />
          {errors.experience?.message ? (
            <span className="text-micro font-normal text-error">
              {errors.experience.message}
            </span>
          ) : null}
        </label>

        <label className="grid gap-2 text-caption font-semibold">
          Product categories
          <span className="font-normal text-gray-700">
            (example: Watches, Trays, Keychains)
          </span>
          <input
            className={fieldClass}
            placeholder="Separate categories with commas"
            {...register("productCategories")}
          />
          {errors.productCategories?.message ? (
            <span className="text-micro font-normal text-error">
              {errors.productCategories.message}
            </span>
          ) : null}
        </label>

        <label className="grid gap-2 text-caption font-semibold">
          Why Sidra
          <textarea
            className={`${fieldClass} min-h-32 resize-y`}
            {...register("whyJoin")}
          />
          {errors.whyJoin?.message ? (
            <span className="text-micro font-normal text-error">
              {errors.whyJoin.message}
            </span>
          ) : null}
        </label>

        <label className="grid gap-2 text-caption font-semibold">
          Portfolio images
          <input
            className={fieldClass}
            type="file"
            accept="image/*"
            multiple
            disabled={submitting}
            onChange={(event) =>
              setFiles(
                Array.from(event.target.files ?? []).slice(0, 8),
              )
            }
          />
          <span className="text-micro font-normal text-gray-700">
            1–8 images, maximum 4 MB each. The application record is
            saved before uploads begin.
          </span>
        </label>
      </Card>

      {stage ? (
        <p
          className="rounded-2xl border border-gold-500/30 bg-gold-100/60 p-4 text-caption font-semibold text-black-900"
          role="status"
        >
          {stage}
        </p>
      ) : null}

      <Button
        className="w-full sm:w-auto"
        type="submit"
        loading={submitting}
        disabled={submitting}
      >
        Request Studio Access
      </Button>
    </form>
  );
}
