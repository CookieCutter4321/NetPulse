import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";
import { useNavigate } from 'react-router';
import { useAuth } from "@/components/authContext"
import { useEffect } from "react";

export default function LoginCard() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
      if (isAuthenticated === true) {
        navigate("/chat");
      }
    }, [isAuthenticated, navigate]);

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault(); // Stop the page from reloading

        const target = e.target as typeof e.target & {
        username: { value: string };
        password: { value: string };
        confirmPassword: {value: string};
        };
        
        const username = target.username.value;
        const password = target.password.value;
        const confirmPassword = target.confirmPassword.value;

        if (!username || !password || !confirmPassword) {
            alert("Incomplete fields")
            return;
        }
        if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
        }
        console.log("Submitting:", { username, password });
        navigate('/')
    };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-4">
      <Card className="flex h-full max-h-125 w-full max-w-125 flex-col shadow-lg bg-white justify-between">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-slate-800">Welcome Back</CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col justify-center space-y-4 px-6 pb-8">
          <form className="space-y-4" onSubmit={(e) => handleSubmit(e)}>
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

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600" htmlFor="password">Confirm Password</label>
              <input 
                id="confirmPassword"
                name="confirmPassword"
                type="password" 
                placeholder="••••••••" 
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors text-sm mt-2"
            >
              Submit
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}