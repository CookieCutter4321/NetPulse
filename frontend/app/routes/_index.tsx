import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";
import { Link, useNavigate } from 'react-router'
import { useAuth } from "@/components/authContext"
import { useEffect } from "react";

type UserLogin = {
    Username: string;
    Password: string;
    AuthProvider: string | null;
    IsLogin: boolean;
};

export default function LoginCard() {
  const navigate = useNavigate();

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated === true) {
      navigate("/chat");
    }
  }, [isAuthenticated, navigate]);

  async function handleLogin(username: string, password: string, authProvider: string | null) {
    const payload: UserLogin = {
      Username: username,
      Password: password,
      AuthProvider: authProvider,
      IsLogin: true
    }

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Authentication failed:", errorText);
        alert(`Error: ${errorText}`);
        return;
      }
      navigate("/chat")
    } catch (error) {
      console.error("Network error:", error)
    }
  }
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-4">
      <Card className="flex h-full max-h-125 w-full max-w-125 flex-col shadow-lg bg-white justify-between">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-slate-800">Welcome Back</CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col justify-center space-y-4 px-6 pb-8">
          <form className="space-y-4" onSubmit={(e) => {e.preventDefault(); handleLogin(e.currentTarget.username.value,e.currentTarget.password.value, null)}}>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600" htmlFor="username">Username or Email</label>
              <input 
                id="username"
                name="username"
                type="text" 
                placeholder="Enter your username" 
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600" htmlFor="password">Password</label>
              <input 
                id="password"
                name="password"
                type="password" 
                placeholder="••••••••" 
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors text-sm mt-2"
            >
              Sign In
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase">Or continue with</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button 
            type="button"
            className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2 rounded-md transition-colors text-sm"
          >
            {/* Simple Inline Google SVG Icon */}
            <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          {/* Add this right below the Google button container */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="font-medium text-blue-600 hover:text-blue-700 transition-colors hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}