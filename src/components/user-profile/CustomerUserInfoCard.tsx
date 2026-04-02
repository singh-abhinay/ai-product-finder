"use client";
import React, { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useToast } from "@/components/ui/use-toast";

interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    fname: string | null;
    lname: string | null;
    phone: string | null;
    role: string;
}

export default function CustomerUserInfoCard() {
    const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
    const { isOpen: isEmailOpen, openModal: openEmailModal, closeModal: closeEmailModal } = useModal();
    const { isOpen: isPasswordOpen, openModal: openPasswordModal, closeModal: closePasswordModal } = useModal();
    const { toast } = useToast();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        fname: "",
        lname: "",
        name: "",
        phone: "",
    });
    const [emailData, setEmailData] = useState({ email: "" });
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await fetch("/api/user/profile", {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to fetch profile");
            }

            const data = await response.json();
            setProfile(data.user);
            setFormData({
                fname: data.user.fname || "",
                lname: data.user.lname || "",
                name: data.user.name || "",
                phone: data.user.phone || "",
            });
            setEmailData({ email: data.user.email || "" });
        } catch (error) {
            console.error("Error fetching profile:", error);
            toast({
                title: "Error",
                description: "Failed to load profile",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmailData({ email: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async () => {
        setSubmitting(true);
        try {
            const response = await fetch("/api/user/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update profile");
            }

            setProfile(data.user);
            toast({
                title: "Success",
                description: "Profile updated successfully",
            });
            closeEditModal();
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update profile",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveEmail = async () => {
        if (!emailData.email) {
            toast({
                title: "Error",
                description: "Email is required",
                variant: "destructive",
            });
            return;
        }

        if (!/\S+@\S+\.\S+/.test(emailData.email)) {
            toast({
                title: "Error",
                description: "Please enter a valid email address",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch("/api/user/profile/email", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ email: emailData.email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update email");
            }

            setProfile(prev => prev ? { ...prev, email: emailData.email } : null);
            toast({
                title: "Success",
                description: "Email updated successfully",
            });
            closeEmailModal();
        } catch (error) {
            console.error("Error updating email:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update email",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSavePassword = async () => {
        if (!passwordData.currentPassword) {
            toast({
                title: "Error",
                description: "Current password is required",
                variant: "destructive",
            });
            return;
        }

        if (!passwordData.newPassword) {
            toast({
                title: "Error",
                description: "New password is required",
                variant: "destructive",
            });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast({
                title: "Error",
                description: "Password must be at least 6 characters",
                variant: "destructive",
            });
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch("/api/user/profile/password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update password");
            }

            toast({
                title: "Success",
                description: "Password updated successfully",
            });
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
            closePasswordModal();
        } catch (error) {
            console.error("Error updating password:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update password",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
                </div>
            </div>
        );
    }

    if (!profile) {
        return null;
    }

    return (
        <>
            <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
                            Personal Information
                        </h4>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    First Name
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {profile.fname || "Not set"}
                                </p>
                            </div>

                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    Last Name
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {profile.lname || "Not set"}
                                </p>
                            </div>

                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    Display Name
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {profile.name || "Not set"}
                                </p>
                            </div>

                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    Email address
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {profile.email}
                                </p>
                            </div>

                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    Phone
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {profile.phone || "Not set"}
                                </p>
                            </div>

                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    Role
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {profile.role}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={openEditModal}
                            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
                        >
                            <svg
                                className="fill-current"
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                                    fill=""
                                />
                            </svg>
                            Edit Profile
                        </button>
                        <button
                            onClick={openEmailModal}
                            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
                        >
                            <svg
                                className="fill-current"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 12H8m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                    stroke="currentColor"
                                    fill="none"
                                />
                                <path
                                    d="M12 8v4l3 3"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                />
                            </svg>
                            Change Email
                        </button>
                        <button
                            onClick={openPasswordModal}
                            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
                        >
                            <svg
                                className="fill-current"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6-4H6a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v4a2 2 0 01-2 2h-2M8 11V7a4 4 0 118 0v4"
                                    stroke="currentColor"
                                    fill="none"
                                />
                                <path
                                    d="M12 15v2"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeWidth={2}
                                />
                            </svg>
                            Change Password
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            <Modal isOpen={isEditOpen} onClose={closeEditModal} className="max-w-[700px] m-4">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Edit Personal Information
                        </h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                            Update your details to keep your profile up-to-date.
                        </p>
                    </div>
                    <form className="flex flex-col">
                        <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                                <div className="col-span-2 lg:col-span-1">
                                    <Label>First Name</Label>
                                    <Input
                                        type="text"
                                        name="fname"
                                        defaultValue={formData.fname}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="col-span-2 lg:col-span-1">
                                    <Label>Last Name</Label>
                                    <Input
                                        type="text"
                                        name="lname"
                                        defaultValue={formData.lname}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="col-span-2 lg:col-span-1">
                                    <Label>Display Name</Label>
                                    <Input
                                        type="text"
                                        name="name"
                                        defaultValue={formData.name}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="col-span-2 lg:col-span-1">
                                    <Label>Phone</Label>
                                    <Input
                                        type="tel"
                                        name="phone"
                                        defaultValue={formData.phone}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button size="sm" variant="outline" onClick={closeEditModal} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button size="sm" onClick={handleSaveProfile} disabled={submitting}>
                                {submitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Change Email Modal */}
            <Modal isOpen={isEmailOpen} onClose={closeEmailModal} className="max-w-[500px] m-4">
                <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
                    <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                        Change Email Address
                    </h4>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                        Enter your new email address. You'll need to verify it later.
                    </p>

                    <div className="mb-6">
                        <Label>New Email Address</Label>
                        <Input
                            type="email"
                            name="email"
                            defaultValue={emailData.email}
                            onChange={handleEmailChange}
                            placeholder="Enter new email"
                        />
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                        <Button size="sm" variant="outline" onClick={closeEmailModal} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveEmail} disabled={submitting}>
                            {submitting ? "Updating..." : "Update Email"}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Change Password Modal */}
            <Modal isOpen={isPasswordOpen} onClose={closePasswordModal} className="max-w-[500px] m-4">
                <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
                    <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                        Change Password
                    </h4>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                        Enter your current password and choose a new one.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <Label>Current Password</Label>
                            <Input
                                type="password"
                                name="currentPassword"
                                defaultValue={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                placeholder="Enter current password"
                            />
                        </div>

                        <div>
                            <Label>New Password</Label>
                            <Input
                                type="password"
                                name="newPassword"
                                defaultValue={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                placeholder="Enter new password (min 6 characters)"
                            />
                        </div>

                        <div>
                            <Label>Confirm New Password</Label>
                            <Input
                                type="password"
                                name="confirmPassword"
                                defaultValue={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                placeholder="Confirm new password"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6 justify-end">
                        <Button size="sm" variant="outline" onClick={closePasswordModal} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSavePassword} disabled={submitting}>
                            {submitting ? "Updating..." : "Update Password"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}