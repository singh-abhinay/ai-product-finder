"use client";
import React, { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";

interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    fname: string | null;
    lname: string | null;
    phone: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postalCode: string | null;
    profileImage: string | null;
    role: string;
}

export default function CustomerUserMetaCard() {
    const { isOpen, openModal, closeModal } = useModal();
    const { toast } = useToast();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [removingImage, setRemovingImage] = useState(false);
    const [formData, setFormData] = useState({
        fname: "",
        lname: "",
        name: "",
        phone: "",
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast({
                title: "Error",
                description: "Please upload an image file",
                variant: "destructive",
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "Error",
                description: "Image size should be less than 5MB",
                variant: "destructive",
            });
            return;
        }

        setUploadingImage(true);

        try {
            const formData = new FormData();
            formData.append("image", file);

            const response = await fetch("/api/user/profile/image", {
                method: "POST",
                credentials: "include",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to upload image");
            }

            setProfile(prev => prev ? { ...prev, profileImage: data.imageUrl } : null);
            toast({
                title: "Success",
                description: "Profile image updated successfully",
            });
        } catch (error) {
            console.error("Error uploading image:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to upload image",
                variant: "destructive",
            });
        } finally {
            setUploadingImage(false);
        }
    };

    const handleRemoveImage = async () => {
        if (!confirm("Are you sure you want to remove your profile picture?")) return;

        setRemovingImage(true);
        try {
            const response = await fetch("/api/user/profile/image", {
                method: "DELETE",
                credentials: "include",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to remove image");
            }

            setProfile(prev => prev ? { ...prev, profileImage: null } : null);
            toast({
                title: "Success",
                description: "Profile image removed successfully",
            });
        } catch (error) {
            console.error("Error removing image:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to remove image",
                variant: "destructive",
            });
        } finally {
            setRemovingImage(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            const response = await fetch("/api/user/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(formData), // Only sending meta fields
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
            closeModal();
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update profile",
                variant: "destructive",
            });
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
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                        <div className="relative group">
                            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
                                {profile.profileImage ? (
                                    <Image
                                        width={80}
                                        height={80}
                                        src={profile.profileImage}
                                        alt="user"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-r from-brand-500 to-brand-600 flex items-center justify-center text-white text-2xl font-bold">
                                        {(profile.fname?.[0] || profile.email[0]).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <label
                                    htmlFor="profile-image"
                                    className="cursor-pointer p-1.5 bg-white rounded-full hover:bg-gray-100 transition-colors"
                                    title="Upload new image"
                                >
                                    <svg
                                        className="w-4 h-4 text-gray-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                    <input
                                        id="profile-image"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                    />
                                </label>

                                {profile.profileImage && (
                                    <button
                                        onClick={handleRemoveImage}
                                        disabled={removingImage}
                                        className="p-1.5 bg-white rounded-full hover:bg-gray-100 transition-colors"
                                        title="Remove image"
                                    >
                                        <svg
                                            className="w-4 h-4 text-red-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {(uploadingImage || removingImage) && (
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                                </div>
                            )}
                        </div>
                        <div className="order-3 xl:order-2">
                            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                                {profile.fname || profile.name || "User"} {profile.lname || ""}
                            </h4>
                            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {profile.role}
                                </p>
                                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {profile.city && profile.country ? `${profile.city}, ${profile.country}` : "Location not set"}
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={openModal}
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
                        Edit
                    </button>
                </div>
            </div>

            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Edit Personal Information
                        </h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                            Update your personal details
                        </p>
                    </div>
                    <form className="flex flex-col">
                        <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
                            <div className="mt-7">
                                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                                    Personal Information
                                </h5>

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
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button size="sm" variant="outline" onClick={closeModal}>
                                Close
                            </Button>
                            <Button size="sm" onClick={handleSave}>
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}