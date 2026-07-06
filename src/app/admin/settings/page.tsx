"use client";

import { useEffect, useState } from "react";
import ImageUploader from "@/components/admin/ImageUploader";

export default function SettingsPage() {
  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] = useState({
    site_name: "",

    logo: "",

    hero_title: "",
    hero_subtitle: "",
    hero_image: "",

    hero_button_text: "",
    hero_button_link: "",

    phone: "",
    email: "",

    facebook: "",
    instagram: "",
    youtube: "",
    whatsapp: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await fetch(
        "/api/admin/settings"
      );

      const data =
        await response.json();

      if (
        data.success &&
        data.settings
      ) {
        setForm({
          site_name:
            data.settings.site_name || "",

          logo:
            data.settings.logo || "",

          hero_title:
            data.settings.hero_title || "",

          hero_subtitle:
            data.settings.hero_subtitle || "",

          hero_image:
            data.settings.hero_image || "",

          hero_button_text:
            data.settings.hero_button_text ||
            "",

          hero_button_link:
            data.settings.hero_button_link ||
            "",

          phone:
            data.settings.phone || "",

          email:
            data.settings.email || "",

          facebook:
            data.settings.facebook ||
            "",

          instagram:
            data.settings.instagram ||
            "",

          youtube:
            data.settings.youtube || "",

          whatsapp:
            data.settings.whatsapp ||
            "",
        });
      }
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  }

  async function saveSettings() {
    try {
      setSaving(true);

      const response = await fetch(
        "/api/admin/settings",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            form
          ),
        }
      );

      const data =
        await response.json();

      if (data.success) {
        alert(
          "Settings saved successfully"
        );
      } else {
        alert(
          data.error ||
            "Save failed"
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        "Something went wrong"
      );
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="p-8">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-8">
      <h1 className="mb-8 text-4xl font-bold text-gray-900">
        Settings
      </h1>

      <div className="space-y-8">

        {/* General */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-6 text-2xl font-bold">
            General Settings
          </h2>

          <div className="space-y-5">

            <div>
              <label className="mb-2 block font-medium">
                Site Name
              </label>

              <input
                type="text"
                value={form.site_name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    site_name:
                      e.target.value,
                  })
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
              />
            </div>

            <ImageUploader
              label="Logo"
              value={form.logo}
              bucket="settings"
              onChange={(url) =>
                setForm({
                  ...form,
                  logo: url,
                })
              }
            />

          </div>
        </div>

        {/* Hero Banner */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-6 text-2xl font-bold">
            Hero Banner
          </h2>

          <div className="space-y-5">

            <div>
              <label className="mb-2 block font-medium">
                Hero Title
              </label>

              <input
                type="text"
                value={
                  form.hero_title
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    hero_title:
                      e.target.value,
                  })
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Hero Subtitle
              </label>

              <textarea
                rows={4}
                value={
                  form.hero_subtitle
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    hero_subtitle:
                      e.target.value,
                  })
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
              />
            </div>

            <ImageUploader
              label="Hero Image"
              value={form.hero_image}
              bucket="settings"
              onChange={(url) =>
                setForm({
                  ...form,
                  hero_image: url,
                })
              }
            />

            <div>
              <label className="mb-2 block font-medium">
                Button Text
              </label>

              <input
                type="text"
                value={
                  form.hero_button_text
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    hero_button_text:
                      e.target.value,
                  })
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Button Link
              </label>

              <input
                type="text"
                value={
                  form.hero_button_link
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    hero_button_link:
                      e.target.value,
                  })
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
              />
            </div>

          </div>
        </div>

        {/* Contact */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-6 text-2xl font-bold">
            Contact Information
          </h2>

          <div className="grid gap-5 md:grid-cols-2">

            <input
              type="text"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone:
                    e.target.value,
                })
              }
              className="rounded-xl border border-gray-300 px-4 py-3"
            />

            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email:
                    e.target.value,
                })
              }
              className="rounded-xl border border-gray-300 px-4 py-3"
            />

          </div>
        </div>

        {/* Social */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-6 text-2xl font-bold">
            Social Links
          </h2>

          <div className="space-y-4">

            <input
              type="text"
              placeholder="Facebook"
              value={
                form.facebook
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  facebook:
                    e.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
            />

            <input
              type="text"
              placeholder="Instagram"
              value={
                form.instagram
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  instagram:
                    e.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
            />

            <input
              type="text"
              placeholder="YouTube"
              value={
                form.youtube
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  youtube:
                    e.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
            />

            <input
              type="text"
              placeholder="WhatsApp"
              value={
                form.whatsapp
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  whatsapp:
                    e.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
            />

          </div>
        </div>

        <button
          onClick={saveSettings}
          disabled={saving}
          className="rounded-xl bg-emerald-600 px-8 py-4 font-semibold text-white transition hover:bg-emerald-700"
        >
          {saving
            ? "Saving..."
            : "Save Settings"}
        </button>

      </div>
    </div>
  );
}