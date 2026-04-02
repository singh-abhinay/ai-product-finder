"use client";
import React, { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useToast } from "@/components/ui/use-toast";
import { Country, State } from "country-state-city";

interface UserProfile {
    id: string;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postalCode: string | null;
}

export default function CustomerUserAddressCard() {
    const { isOpen, openModal, closeModal } = useModal();
    const { toast } = useToast();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
    });

    const countries = Country.getAllCountries();
    const states = State.getStatesOfCountry(formData.country);

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
                addressLine1: data.user.addressLine1 || "",
                addressLine2: data.user.addressLine2 || "",
                city: data.user.city || "",
                state: data.user.state || "",
                country: data.user.country || "",
                postalCode: data.user.postalCode || "",
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCountry = e.target.value;
        setFormData(prev => ({
            ...prev,
            country: newCountry,
            state: "", // Reset state when country changes
        }));
    };

    const handleSave = async () => {
        try {
            const response = await fetch("/api/user/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(formData), // Only sending address fields
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update address");
            }

            setProfile(data.user);
            toast({
                title: "Success",
                description: "Address updated successfully",
            });
            closeModal();
        } catch (error) {
            console.error("Error updating address:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update address",
                variant: "destructive",
            });
        }
    };

    const getCountryName = (countryCode: string) => {
        const country = countries.find(c => c.isoCode === countryCode);
        return country ? country.name : countryCode;
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
                            Address
                        </h4>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    Country
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {getCountryName(profile.country || "") || "Not set"}
                                </p>
                            </div>

                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    Address Line 1
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {profile.addressLine1 || "Not set"}
                                </p>
                            </div>

                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    Address Line 2
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {profile.addressLine2 || "Not set"}
                                </p>
                            </div>

                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    City
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {profile.city || "Not set"}
                                </p>
                            </div>

                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    State
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {profile.state || "Not set"}
                                </p>
                            </div>

                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    Postal Code
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {profile.postalCode || "Not set"}
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
                <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Edit Address
                        </h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                            Update your address details
                        </p>
                    </div>
                    <form className="flex flex-col">
                        <div className="px-2 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                                <div>
                                    <Label>Country</Label>
                                    <select
                                        name="country"
                                        value={formData.country}
                                        onChange={handleCountryChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600"
                                    >
                                        <option value="">Select Country</option>
                                        {countries.map((country) => (
                                            <option key={country.isoCode} value={country.isoCode}>
                                                {country.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Label>State</Label>
                                    <select
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        disabled={!formData.country}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 ${!formData.country ? "opacity-50 cursor-not-allowed" : ""
                                            }`}
                                    >
                                        <option value="">Select State</option>
                                        {states.map((state) => (
                                            <option key={state.isoCode} value={state.name}>
                                                {state.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Label>City</Label>
                                    <Input
                                        type="text"
                                        name="city"
                                        defaultValue={formData.city}
                                        onChange={handleInputChange}
                                        placeholder="Enter city"
                                    />
                                </div>

                                <div>
                                    <Label>Postal Code</Label>
                                    <Input
                                        type="text"
                                        name="postalCode"
                                        defaultValue={formData.postalCode}
                                        onChange={handleInputChange}
                                        placeholder="Enter postal code"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <Label>Address Line 1</Label>
                                    <Input
                                        type="text"
                                        name="addressLine1"
                                        defaultValue={formData.addressLine1}
                                        onChange={handleInputChange}
                                        placeholder="Street address"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <Label>Address Line 2 (Optional)</Label>
                                    <Input
                                        type="text"
                                        name="addressLine2"
                                        defaultValue={formData.addressLine2}
                                        onChange={handleInputChange}
                                        placeholder="Apartment, suite, unit, etc."
                                    />
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