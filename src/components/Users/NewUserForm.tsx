"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { createUserAction } from "@/lib/actions/users";

export default function NewUserForm({ camps = [] }: { camps?: {id: string, name: string}[] }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "user" as "user" | "admin" | "camp_manager" | "org_representative" | "independent_initiator" | "beneficiary",
    campId: "",
    // Household fields, used only when the role is `beneficiary`.
    nationalId: "",
    householdCampId: "",
    memberCount: 1,
    occupation: "",
  });

  const isBeneficiary = form.role === "beneficiary";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "memberCount" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }
    if (!form.email.trim()) {
      toast.error(t("emailRequired"));
      return;
    }
    if (!form.password || form.password.length < 8) {
      toast.error(t("passwordMinLengthError"));
      return;
    }
    if (isBeneficiary) {
      if (!form.nationalId.trim()) {
        toast.error(t("errNationalIdRequired"));
        return;
      }
      if (!form.householdCampId) {
        toast.error(t("errCampRequired"));
        return;
      }
      if (form.memberCount < 1) {
        toast.error(t("memberCountValidationError"));
        return;
      }
    }

    setLoading(true);

    const res = await createUserAction({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      phone: form.phone || null,
      campId: form.role === "camp_manager" ? (form.campId || null) : null,
      household: isBeneficiary
        ? {
            nationalId: form.nationalId.trim(),
            campId: form.householdCampId,
            memberCount: form.memberCount,
            occupation: form.occupation || null,
          }
        : null,
    });

    setLoading(false);

    if (res.error) {
      toast.error(t(res.error));
      return;
    }

    toast.success(t("userCreated"));
    router.push("/dashboard/users");
    router.refresh();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark dark:text-white">
          {t("addUser")}
        </h1>
        <p className="text-sm text-dark-4 dark:text-dark-6">
          {t("addUserSubtitle")}
        </p>
      </div>

      <div className="max-w-lg rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
              {t("nameLabel")}
            </label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder={t("namePlaceholder")}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
              {t("emailAddress")}
            </label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="user@sa3dne.com"
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
              {t("passwordLabel")}
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange}
              placeholder={t("passwordMinLengthPlaceholder")}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
              {t("phoneOptional")}
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+966501234567"
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
              {t("userRole")}
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            >
              <option value="user">{t("roleUser")}</option>
              <option value="beneficiary">{t("roleBeneficiary")}</option>
              <option value="camp_manager">{t("roleCampManager")}</option>
              <option value="admin">{t("roleAdmin")}</option>
            </select>
          </div>
          
          {form.role === "camp_manager" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                {t("assignCampToUser")}
              </label>
              <select
                name="campId"
                value={form.campId}
                onChange={handleChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                <option value="">{t("selectCampPlaceholder")}</option>
                {camps.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {isBeneficiary && (
            <fieldset className="space-y-4 rounded-lg border border-stroke p-4 dark:border-dark-3">
              <legend className="px-2 text-sm font-semibold text-dark dark:text-white">
                {t("householdSectionTitle")}
              </legend>
              <p className="text-xs text-dark-4 dark:text-dark-6">
                {t("householdSectionHint")}
              </p>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {t("nationalId")}
                </label>
                <input
                  type="text"
                  name="nationalId"
                  value={form.nationalId}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {t("campName")}
                </label>
                <select
                  name="householdCampId"
                  value={form.householdCampId}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                >
                  <option value="">{t("selectCampPlaceholder")}</option>
                  {camps.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {t("memberCount")}
                </label>
                <input
                  type="number"
                  name="memberCount"
                  min={1}
                  value={form.memberCount}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {t("occupation")}
                </label>
                <input
                  type="text"
                  name="occupation"
                  value={form.occupation}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
            </fieldset>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-70"
            >
              {loading ? t("creating") : t("createUser")}
            </button>
            <Link
              href="/dashboard/users"
              className="flex-1 rounded-lg border border-stroke px-5 py-2.5 text-center text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
            >
              {t("cancel")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
