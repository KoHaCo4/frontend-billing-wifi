"use client";

export default function Card({ children, className = "", onClick }) {
  return (
    <div
      className={`bg-white rounded-lg shadow p-6 ${
        onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
