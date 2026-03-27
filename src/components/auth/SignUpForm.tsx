"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Country, State } from "country-state-city";

export default function SignUpForm() {
  const { toast } = useToast();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    password: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "IN",
    postalCode: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(formData.country);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      country: e.target.value,
      state: "",
    }));
    if (errors.country) {
      setErrors((prev) => ({ ...prev, country: "" }));
    }
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      state: e.target.value,
    }));
    if (errors.state) {
      setErrors((prev) => ({ ...prev, state: "" }));
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.fname.trim()) errors.fname = "First name is required";
    if (!formData.lname.trim()) errors.lname = "Last name is required";

    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errors.email = "Email is invalid";

    if (!formData.password) errors.password = "Password is required";
    else if (formData.password.length < 6)
      errors.password = "Minimum 6 characters required";

    if (!formData.phone.trim()) errors.phone = "Phone is required";
    else if (!/^[6-9]\d{9}$/.test(formData.phone))
      errors.phone = "Invalid phone number";

    if (!formData.addressLine1.trim())
      errors.addressLine1 = "Address is required";

    if (!formData.city.trim()) errors.city = "City is required";
    if (!formData.state) errors.state = "State is required";
    if (!formData.country) errors.country = "Country is required";

    if (!formData.postalCode.trim())
      errors.postalCode = "Postal code is required";
    else if (!/^\d{6}$/.test(formData.postalCode))
      errors.postalCode = "Invalid PIN code";

    return errors;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isChecked) {
      toast({
        title: "Warning",
        description: "Please accept Terms & Conditions",
        variant: "destructive",
      });
      return;
    }

    const newErrors = validateForm();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.status === 201) {
        toast({
          title: "Success",
          description: data.message || "Account created successfully!"
        });

        setFormData({
          fname: "",
          lname: "",
          email: "",
          password: "",
          phone: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          country: "IN",
          postalCode: "",
        });

        setIsChecked(false);

        router.push("/signin");
      } else {
        toast({
          title: "Error",
          description: data.message || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "Error",
        description: "Signup failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4 mr-1" />
          Back to dashboard
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <h1 className="mb-6 font-semibold text-2xl text-gray-800 dark:text-white">
          Sign Up
        </h1>

        <form onSubmit={handleSignUp} className="space-y-5">
          {/* Name */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label htmlFor="fname">First Name</Label>
              <Input
                id="fname"
                name="fname"
                defaultValue={formData.fname}
                onChange={handleInputChange}
                error={!!errors.fname}
                hint={errors.fname}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="lname">Last Name</Label>
              <Input
                id="lname"
                name="lname"
                defaultValue={formData.lname}
                onChange={handleInputChange}
                error={!!errors.lname}
                hint={errors.lname}
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={formData.email}
              onChange={handleInputChange}
              error={!!errors.email}
              hint={errors.email}
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                defaultValue={formData.password}
                onChange={handleInputChange}
                error={!!errors.password}
                hint={errors.password}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeIcon className="w-5 h-5" /> : <EyeCloseIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={formData.phone}
              onChange={handleInputChange}
              error={!!errors.phone}
              hint={errors.phone}
              disabled={loading}
            />
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="addressLine1">Address Line 1</Label>
            <Input
              id="addressLine1"
              name="addressLine1"
              defaultValue={formData.addressLine1}
              onChange={handleInputChange}
              error={!!errors.addressLine1}
              hint={errors.addressLine1}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
            <Input
              id="addressLine2"
              name="addressLine2"
              defaultValue={formData.addressLine2}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          {/* Country */}
          <div>
            <Label htmlFor="country">Country</Label>
            <select
              id="country"
              defaultValue={formData.country}
              onChange={handleCountryChange}
              disabled={loading}
              className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${errors.country ? "border-red-500" : "border-gray-300"
                }`}
            >
              <option value="">Select Country</option>
              {countries.map((c) => (
                <option key={c.isoCode} value={c.isoCode}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.country && (
              <p className="mt-1 text-sm text-red-500">{errors.country}</p>
            )}
          </div>

          {/* State */}
          <div>
            <Label htmlFor="state">State</Label>
            <select
              id="state"
              defaultValue={formData.state}
              onChange={handleStateChange}
              disabled={loading}
              className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${errors.state ? "border-red-500" : "border-gray-300"
                }`}
            >
              <option value="">Select State</option>
              {states.map((s) => (
                <option key={s.isoCode} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.state && (
              <p className="mt-1 text-sm text-red-500">{errors.state}</p>
            )}
          </div>

          {/* City & PIN */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                defaultValue={formData.city}
                onChange={handleInputChange}
                error={!!errors.city}
                hint={errors.city}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="postalCode">PIN Code</Label>
              <Input
                id="postalCode"
                name="postalCode"
                defaultValue={formData.postalCode}
                onChange={handleInputChange}
                error={!!errors.postalCode}
                hint={errors.postalCode}
                disabled={loading}
              />
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isChecked}
              onChange={setIsChecked}
              disabled={loading}
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              I agree to the{" "}
              <Link href="/terms" className="text-brand-500 hover:underline">
                Terms & Conditions
              </Link>
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

          {/* Sign In Link */}
          <p className="text-center text-sm text-gray-600 dark:text-gray-300">
            Already have an account?{" "}
            <Link href="/signin" className="text-brand-500 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}