"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import Cookies from "js-cookie";
import { useToast } from "@/components/ui/use-toast";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  fname: string | null;
  lname: string | null;
  phone: string | null;
  profileImage: string | null;
  role: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
}

export default function UserDropdown() {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const cookieUser = Cookies.get("userInfo");
      if (cookieUser) {
        const parsedUser = JSON.parse(cookieUser);

        setUser({
          id: parsedUser.id,
          email: parsedUser.email,
          name: parsedUser.name,
          fname: parsedUser.fname,
          lname: parsedUser.lname,
          phone: parsedUser.phone,
          profileImage: parsedUser.profileImage || null,
          role: parsedUser.role,
          addressLine1: parsedUser.addressLine1 || null,
          addressLine2: parsedUser.addressLine2 || null,
          city: parsedUser.city || null,
          state: parsedUser.state || null,
          country: parsedUser.country || null,
          postalCode: parsedUser.postalCode || null,
        });
      }

      const response = await fetch("/api/user/profile", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();

        if (data.user) {
          setUser(data.user);
          const updatedUserInfo = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name || data.user.fname,
            fname: data.user.fname,
            lname: data.user.lname,
            phone: data.user.phone,
            profileImage: data.user.profileImage,
            role: data.user.role,
            addressLine1: data.user.addressLine1,
            addressLine2: data.user.addressLine2,
            city: data.user.city,
            state: data.user.state,
            country: data.user.country,
            postalCode: data.user.postalCode,
          };

          Cookies.set("userInfo", JSON.stringify(updatedUserInfo), {
            expires: 7,
            path: "/",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        Cookies.remove("userInfo", { path: "/" });
        document.cookie =
          "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        toast({
          title: "Logged out successfully",
          description: "You have been logged out",
        });

        router.push("/signin");
      } else {
        toast({
          title: "Logout failed",
          description: "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUserDisplayName = () => {
    if (user?.fname && user?.lname) {
      return `${user.fname} ${user.lname}`;
    }
    if (user?.name) {
      return user.name;
    }
    if (user?.fname) {
      return user.fname;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "User";
  };

  const getUserInitials = () => {
    if (user?.fname && user?.lname) {
      return `${user.fname[0]}${user.lname[0]}`.toUpperCase();
    }
    if (user?.fname) {
      return user.fname[0].toUpperCase();
    }
    if (user?.name) {
      return user.name[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  if (loading) {
    return (
      <div className="relative">
        <button
          className="flex items-center text-gray-700 dark:text-gray-400"
          disabled
        >
          <span className="mr-3 overflow-hidden rounded-full h-11 w-11 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <span className="block mr-1 font-medium text-theme-sm bg-gray-200 dark:bg-gray-700 h-5 w-20 animate-pulse rounded" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dark:text-gray-400 dropdown-toggle"
      >
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          {user?.profileImage ? (
            <Image
              width={44}
              height={44}
              src={user.profileImage}
              alt={getUserDisplayName()}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-brand-500 to-brand-600 flex items-center justify-center text-white text-lg font-medium">
              {getUserInitials()}
            </div>
          )}
        </span>
        <span className="block mr-1 font-medium text-theme-sm">
          {getUserDisplayName()}
        </span>

        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
            }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
          <div className="w-12 h-12 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            {user?.profileImage ? (
              <Image
                width={48}
                height={48}
                src={user.profileImage}
                alt={getUserDisplayName()}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-brand-500 to-brand-600 flex items-center justify-center text-white text-lg font-medium">
                {getUserInitials()}
              </div>
            )}
          </div>
          <div>
            <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
              {getUserDisplayName()}
            </span>
            <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
              {user?.email}
            </span>
            <span className="mt-0.5 block text-theme-xs text-brand-500 dark:text-brand-400">
              {user?.role}
            </span>
          </div>
        </div>

        <ul className="flex flex-col gap-1 pt-3 pb-3">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700"
            >
              Edit profile
            </DropdownItem>
          </li>
        </ul>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 mt-1 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100"
        >
          Sign out
        </button>
      </Dropdown>
    </div>
  );
}