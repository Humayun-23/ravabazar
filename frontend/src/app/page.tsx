"use client";

import { useState } from "react";

type Endpoint = {
  name: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  auth?: boolean;
  adminAuth?: boolean;
  body?: any;
};

type Category = {
  title: string;
  color: string;
  endpoints: Endpoint[];
};

export default function ApiTester() {
  const [response, setResponse] = useState<any>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [userToken, setUserToken] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("");

  const execute = async (endpoint: Endpoint) => {
    setLoading(true);
    setResponse(null);
    setStatus(null);
    setUrl(endpoint.path);
    setMethod(endpoint.method);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (endpoint.adminAuth && adminToken) {
        headers["Authorization"] = `Bearer ${adminToken}`;
      } else if (endpoint.auth && userToken) {
        headers["Authorization"] = `Bearer ${userToken}`;
      }

      const res = await fetch(`http://localhost:8000${endpoint.path}`, {
        method: endpoint.method,
        headers,
        body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
      });

      setStatus(res.status);
      
      const data = await res.json();
      setResponse(data);

      // Auto-save tokens
      if (endpoint.path === "/api/v1/auth/login" && res.status === 200 && data.access_token) {
        setUserToken(data.access_token);
      }
      if (endpoint.path === "/api/v1/admin/auth/login" && res.status === 200 && data.access_token) {
        setAdminToken(data.access_token);
      }
    } catch (err: any) {
      setResponse({ error: err.message || "Failed to fetch" });
    } finally {
      setLoading(false);
    }
  };

  const categories: Category[] = [
    {
      title: "Health & System",
      color: "text-gray-400",
      endpoints: [
        { name: "Health Check", method: "GET", path: "/api/v1/health" }
      ]
    },
    {
      title: "Customer Auth",
      color: "text-indigo-400",
      endpoints: [
        { 
          name: "Register", 
          method: "POST", 
          path: "/api/v1/auth/register",
          body: { phone: "9999999999", email: "test@example.com", password: "password123", first_name: "Test", last_name: "User" }
        },
        { 
          name: "Login", 
          method: "POST", 
          path: "/api/v1/auth/login",
          body: { phone: "9999999999", password: "password123" }
        },
        { name: "Get Profile", method: "GET", path: "/api/v1/users/me", auth: true },
        { 
          name: "Update Profile", 
          method: "PATCH", 
          path: "/api/v1/users/me", 
          auth: true,
          body: { first_name: "Updated Name" }
        }
      ]
    },
    {
      title: "Catalog",
      color: "text-cyan-400",
      endpoints: [
        { name: "List Products", method: "GET", path: "/api/v1/products" },
        { name: "Get Product (wireless-headphones)", method: "GET", path: "/api/v1/products/wireless-headphones" },
        { name: "List Categories", method: "GET", path: "/api/v1/categories" },
        { name: "List Banners", method: "GET", path: "/api/v1/banners" }
      ]
    },
    {
      title: "Cart & Checkout",
      color: "text-orange-400",
      endpoints: [
        { name: "Get Cart", method: "GET", path: "/api/v1/cart", auth: true },
        { 
          name: "Add Item to Cart", 
          method: "POST", 
          path: "/api/v1/cart/items", 
          auth: true,
          body: { product_id: 1, quantity: 1 }
        },
        { 
          name: "Create Order", 
          method: "POST", 
          path: "/api/v1/orders", 
          auth: true,
          body: { address_id: 1, coupon_code: null, payment_provider: "cod" }
        },
        { name: "Get My Orders", method: "GET", path: "/api/v1/orders/my", auth: true }
      ]
    },
    {
      title: "Customer Addresses",
      color: "text-pink-400",
      endpoints: [
        { name: "List Addresses", method: "GET", path: "/api/v1/users/me/addresses", auth: true },
        { 
          name: "Add Address", 
          method: "POST", 
          path: "/api/v1/users/me/addresses", 
          auth: true,
          body: { name: "Home", street: "123 Main St", city: "Mumbai", state: "MH", zip_code: "400001", country: "India", is_default: true }
        }
      ]
    },
    {
      title: "Admin APIs",
      color: "text-red-400",
      endpoints: [
        { 
          name: "Admin Login", 
          method: "POST", 
          path: "/api/v1/admin/auth/login",
          body: { email: "admin@ravabazar.com", password: "adminpassword" }
        },
        { name: "Admin Dashboard Stats", method: "GET", path: "/api/v1/admin/dashboard", adminAuth: true },
        { name: "List All Orders", method: "GET", path: "/api/v1/admin/orders", adminAuth: true },
        { name: "List Coupons", method: "GET", path: "/api/v1/admin/coupons", adminAuth: true },
        { 
          name: "Create Coupon", 
          method: "POST", 
          path: "/api/v1/admin/coupons", 
          adminAuth: true,
          body: { code: "WELCOME50", discount_type: "percentage", discount_value: 50.0, min_order_amount: 500.0, is_active: true }
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-mono text-sm flex">
      {/* Sidebar: API Endpoints */}
      <div className="w-1/3 border-r border-gray-800 flex flex-col h-screen">
        <div className="p-6 pb-4 border-b border-gray-800 shrink-0">
          <h1 className="text-xl font-bold text-white mb-2">Ravabazar API Tester</h1>
          <p className="text-gray-400 text-xs">Execute real API requests locally.</p>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          
          {/* Auth Tokens Status */}
          {(userToken || adminToken) && (
            <div className="bg-gray-900 border border-gray-700 p-3 rounded flex flex-col gap-2">
              {userToken && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-400 font-bold">👤 User Auth Active</span>
                  <button onClick={() => setUserToken(null)} className="text-gray-500 hover:text-red-400 underline">Clear</button>
                </div>
              )}
              {adminToken && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-red-400 font-bold">🛡️ Admin Auth Active</span>
                  <button onClick={() => setAdminToken(null)} className="text-gray-500 hover:text-red-400 underline">Clear</button>
                </div>
              )}
            </div>
          )}

          {/* Render Categories */}
          {categories.map((cat, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded p-4">
              <h2 className={`${cat.color} font-semibold mb-3 border-b border-gray-800 pb-2`}>
                {cat.title}
              </h2>
              <div className="flex flex-col gap-3">
                {cat.endpoints.map((ep, j) => {
                  const isDisabled = (ep.auth && !userToken) || (ep.adminAuth && !adminToken);
                  return (
                    <button 
                      key={j}
                      onClick={() => execute(ep)}
                      disabled={isDisabled}
                      className={`text-left px-3 py-2 rounded flex justify-between group transition-colors ${
                        isDisabled 
                          ? 'bg-gray-950 opacity-50 cursor-not-allowed border border-dashed border-gray-800' 
                          : 'bg-gray-800 hover:bg-gray-700 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {ep.auth && <span title="Requires User Auth" className="text-emerald-500 text-[10px]">🔒</span>}
                        {ep.adminAuth && <span title="Requires Admin Auth" className="text-red-500 text-[10px]">🛡️</span>}
                        <span className="truncate">{ep.name}</span>
                      </div>
                      <span className={`font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2 ${
                        ep.method === 'GET' ? 'text-blue-400' : 
                        ep.method === 'POST' ? 'text-green-400' : 
                        ep.method === 'PATCH' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {ep.method}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content: Viewer */}
      <div className="w-2/3 flex flex-col h-screen">
        {/* URL Bar */}
        <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center px-6 gap-4 shrink-0">
          {method && (
            <span className={`font-bold ${
              method === 'GET' ? 'text-blue-400' : 
              method === 'POST' ? 'text-green-400' : 
              method === 'PATCH' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {method}
            </span>
          )}
          <div className="bg-gray-950 px-4 py-2 rounded border border-gray-800 w-full text-gray-400 flex justify-between font-mono">
            <span>http://localhost:8000{url || "..."}</span>
            {status && (
              <span className={`font-bold ${status >= 200 && status < 300 ? 'text-green-500' : 'text-red-500'}`}>
                {status}
              </span>
            )}
          </div>
        </div>
        
        {/* Response Body */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-950 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : response ? (
            <pre className="text-green-400 bg-gray-900 p-6 rounded-lg border border-gray-800 overflow-x-auto shadow-2xl font-mono text-sm">
              <code>{JSON.stringify(response, null, 2)}</code>
            </pre>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600">
              <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <p>Select an endpoint from the left to test it.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
