"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import {
  listAddresses,
  saveAddress,
} from "@/services/addressBookService";
import { updateEditableProfile } from "@/services/userService";
import type { ShippingAddress } from "@/types/phase6-commerce";

const emptyAddress = (): ShippingAddress => ({
  id: `address-${Date.now()}`,
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: true,
});

async function withTimeout<T>(
  promise: Promise<T>,
  ms = 20000,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      window.setTimeout(
        () =>
          reject(
            new Error(
              "The save request timed out. Check your internet connection and try again.",
            ),
          ),
        ms,
      ),
    ),
  ]);
}

export function CustomerProfileClient(): React.JSX.Element {
  const auth = useRouteGuard({
    requireVerifiedEmail: true,
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<
    readonly ShippingAddress[]
  >([]);
  const [address, setAddress] =
    useState<ShippingAddress>(emptyAddress);

  const [profileSaving, setProfileSaving] =
    useState(false);
  const [addressSaving, setAddressSaving] =
    useState(false);
  const [profileMessage, setProfileMessage] =
    useState("");
  const [addressMessage, setAddressMessage] =
    useState("");
  const hydratedUid = useRef<string | null>(null);

  const storageKey = useMemo(
    () =>
      auth.user
        ? `sidra.profilePhoto.${auth.user.uid}`
        : "",
    [auth.user],
  );

  useEffect(() => {
    if (!auth.user || !auth.profile) {
      return;
    }

    if (hydratedUid.current === auth.user.uid) {
      return;
    }

    hydratedUid.current = auth.user.uid;
    setFullName(auth.profile.fullName);
    setPhone(auth.profile.phone ?? "");

    const localPhoto = storageKey
      ? window.localStorage.getItem(storageKey)
      : null;

    setPhoto(
      localPhoto ||
        auth.profile.profilePhoto ||
        auth.user.photoURL,
    );

    void listAddresses(auth.user.uid)
      .then(setAddresses)
      .catch(() => setAddresses([]));
  }, [auth.profile, auth.user, storageKey]);

  if (auth.loading || !auth.user || !auth.profile) {
    return <LoadingSkeleton count={5} />;
  }

  const saveProfile = async (): Promise<void> => {
    const normalizedName = fullName.trim();

    if (normalizedName.length < 2) {
      setProfileMessage("Enter your complete name.");
      return;
    }

    setProfileSaving(true);
    setProfileMessage("");

    try {
      await withTimeout(
        updateEditableProfile(auth.user!.uid, {
          fullName: normalizedName,
          phone: phone.trim() || null,
          profilePhoto:
            photo ??
            auth.profile!.profilePhoto ??
            auth.user!.photoURL ??
            null,
          notificationPreferences:
            auth.profile!.notificationPreferences,
        }),
      );

      await auth.refresh();
      setFullName(normalizedName);
      setPhone(phone.trim());
      setProfileMessage(
        "Profile name and phone number saved successfully.",
      );
    } catch (caught) {
      setProfileMessage(
        caught instanceof Error
          ? caught.message
          : "Profile could not be saved.",
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const saveDeliveryAddress =
    async (): Promise<void> => {
      const requiredValues = [
        address.name,
        address.phone,
        address.line1,
        address.city,
        address.state,
        address.postalCode,
      ];

      if (requiredValues.some((value) => !value.trim())) {
        setAddressMessage(
          "Complete all required address fields.",
        );
        return;
      }

      setAddressSaving(true);
      setAddressMessage("");

      try {
        const nextAddresses = await withTimeout(
          saveAddress(auth.user!.uid, address),
        );

        setAddresses(nextAddresses);
        setAddress(emptyAddress());
        setAddressMessage(
          "Delivery address saved successfully.",
        );
      } catch (caught) {
        setAddressMessage(
          caught instanceof Error
            ? caught.message
            : "Address could not be saved.",
        );
      } finally {
        setAddressSaving(false);
      }
    };

  return (
    <AccountShell
      mode="customer"
      eyebrow="Personal details"
      title="Profile & addresses"
    >
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-[1.5rem] border border-[rgba(59,30,53,0.12)] bg-white/70 p-5 shadow-[var(--shadow-card)] sm:p-7">
          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--color-deep-plum)] text-2xl font-semibold text-white">
              {photo ? (
                <img
                  src={photo}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                fullName.slice(0, 1).toUpperCase()
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold">
                {fullName}
              </p>
              <p className="mt-1 truncate text-sm text-black/55">
                {auth.user.email}
              </p>
            </div>
          </div>

          <label className="mt-5 block text-sm font-semibold">
            Profile picture
          </label>

          <input
            type="file"
            accept="image/*"
            className="mt-2 block w-full text-sm"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (!file) {
                return;
              }

              if (file.size > 1_500_000) {
                setProfileMessage(
                  "Choose an image smaller than 1.5 MB.",
                );
                return;
              }

              const reader = new FileReader();

              reader.onload = () => {
                const value =
                  typeof reader.result === "string"
                    ? reader.result
                    : "";

                if (!value || !storageKey) {
                  return;
                }

                window.localStorage.setItem(
                  storageKey,
                  value,
                );

                setPhoto(value);
                setProfileMessage(
                  "Profile picture saved on this browser.",
                );
              };

              reader.readAsDataURL(file);
            }}
          />

          <p className="mt-2 text-xs leading-5 text-black/50">
            This picture stays in this browser. Clearing
            browser data removes it.
          </p>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">
              Full name
              <input
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 font-normal outline-none focus:border-[var(--color-dusty-rose)]"
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Phone number
              <input
                type="tel"
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 font-normal outline-none focus:border-[var(--color-dusty-rose)]"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Email
              <input
                disabled
                className="rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 font-normal text-black/50"
                value={auth.user.email ?? ""}
              />
            </label>

            <p className="text-xs leading-5 text-black/50">
              Email changes require secure
              re-authentication and verification.
            </p>

            <button
              type="button"
              disabled={profileSaving}
              className="rounded-full bg-[var(--color-deep-plum)] px-5 py-3 font-semibold text-white disabled:opacity-50"
              onClick={() => void saveProfile()}
            >
              {profileSaving
                ? "Saving profile…"
                : "Save profile"}
            </button>

            {profileMessage ? (
              <p
                role="status"
                className="rounded-2xl border border-[rgba(59,30,53,0.12)] bg-white p-4 text-sm"
              >
                {profileMessage}
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[rgba(59,30,53,0.12)] bg-white/70 p-5 shadow-[var(--shadow-card)] sm:p-7">
          <h2 className="font-display text-3xl text-[var(--color-deep-plum)]">
            Delivery addresses
          </h2>

          {addresses.length ? (
            <div className="mt-5 grid gap-3">
              {addresses.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-black/10 bg-white p-4 text-sm leading-6"
                >
                  <strong>{item.name}</strong>

                  {item.isDefault ? (
                    <span className="ml-2 rounded-full bg-[var(--color-dusty-rose)] px-2 py-1 text-xs">
                      Default
                    </span>
                  ) : null}

                  <p>
                    {item.line1}
                    {item.line2
                      ? `, ${item.line2}`
                      : ""}
                  </p>

                  <p>
                    {item.city}, {item.state}{" "}
                    {item.postalCode}
                  </p>

                  <p>{item.phone}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-black/55">
              No saved address yet.
            </p>
          )}

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["name", "Full name"],
                ["phone", "Phone"],
                ["line1", "Address line 1"],
                ["line2", "Address line 2"],
                ["city", "City"],
                ["state", "State"],
                ["postalCode", "Postal code"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className={
                  key === "line1" || key === "line2"
                    ? "grid gap-2 text-sm font-semibold sm:col-span-2"
                    : "grid gap-2 text-sm font-semibold"
                }
              >
                {label}

                <input
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 font-normal outline-none focus:border-[var(--color-dusty-rose)]"
                  value={address[key]}
                  onChange={(event) =>
                    setAddress((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                />
              </label>
            ))}
          </div>

          <button
            type="button"
            disabled={addressSaving}
            className="mt-5 rounded-full border border-[var(--color-deep-plum)] px-5 py-3 font-semibold text-[var(--color-deep-plum)] disabled:opacity-50"
            onClick={() =>
              void saveDeliveryAddress()
            }
          >
            {addressSaving
              ? "Saving address…"
              : "Save address"}
          </button>

          {addressMessage ? (
            <p
              role="status"
              className="mt-4 rounded-2xl border border-[rgba(59,30,53,0.12)] bg-white p-4 text-sm"
            >
              {addressMessage}
            </p>
          ) : null}
        </section>
      </div>
    </AccountShell>
  );
}
