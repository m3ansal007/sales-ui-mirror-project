import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Target, Eye, EyeOff, User, Shield, AlertTriangle } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Sales Associate');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRoleMismatchWarning, setShowRoleMismatchWarning] = useState(false);
  const [lastAttemptedRole, setLastAttemptedRole] = useState('');
  const [userActualRole, setUserActualRole] = useState('');
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!isLogin && !fullName) {
      toast({
        title: "Error",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    // Clear any previous role mismatch warnings
    setShowRoleMismatchWarning(false);

    try {
      let result;
      if (isLogin) {
        // For login, pass the selected role to verify authorization
        result = await signIn(email, password, role);
      } else {
        // For signup, register with the selected role
        result = await signUp(email, password, fullName, role);
      }

      if (result.error) {
        // Check if this is a role mismatch error
        if (result.error.message.includes('Access denied') && result.error.message.includes('registered as')) {
          // Extract the actual role from the error message
          const match = result.error.message.match(/registered as (\w+(?:\s+\w+)*)/);
          if (match) {
            setUserActualRole(match[1]);
            setLastAttemptedRole(role);
            setShowRoleMismatchWarning(true);
          }
        }
        
        toast({
          title: "Authentication Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        // Clear any warnings on successful login/signup
        setShowRoleMismatchWarning(false);
        
        if (!isLogin) {
          toast({
            title: "Account Created Successfully!",
            description: `Your ${role} account has been created. Please check your email to verify your account.`,
          });
        } else {
          toast({
            title: "Login Successful!",
            description: `Welcome back! You are now logged in as ${role}.`,
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    // Clear role mismatch warning when user changes role
    if (showRoleMismatchWarning) {
      setShowRoleMismatchWarning(false);
    }
  };

  const handleCorrectRole = () => {
    setRole(userActualRole);
    setShowRoleMismatchWarning(false);
  };

  const getRoleDescription = (selectedRole: string) => {
    switch (selectedRole) {
      case 'Admin':
        return '👑 Full access to all features, team management, and system settings';
      case 'Sales Manager':
        return '📊 Team oversight, lead management, and performance analytics';
      case 'Sales Associate':
        return '💼 Individual lead management, tasks, and personal performance tracking';
      default:
        return '';
    }
  };

  const getRoleIcon = (selectedRole: string) => {
    switch (selectedRole) {
      case 'Admin': return '👑';
      case 'Sales Manager': return '📊';
      case 'Sales Associate': return '💼';
      default: return '👤';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="ml-3 text-2xl font-bold text-white">Lead Manager</span>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-slate-400">
              {isLogin ? 'Sign in to your account' : 'Sign up to get started'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pr-10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role selection */}
            <div>
              <Label htmlFor="role" className="text-slate-300 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {isLogin ? 'Login as' : 'Account Type'}
              </Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  id="role"
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Admin">{getRoleIcon('Admin')} Admin</option>
                  <option value="Sales Manager">{getRoleIcon('Sales Manager')} Sales Manager</option>
                  <option value="Sales Associate">{getRoleIcon('Sales Associate')} Sales Associate</option>
                </select>
              </div>
              <div className="mt-2 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                <p className="text-xs text-slate-300">
                  {getRoleDescription(role)}
                </p>
              </div>
            </div>

            {/* Role Mismatch Warning - Only shown after failed login attempt */}
            {showRoleMismatchWarning && isLogin && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-red-300 text-sm font-medium mb-2">Access Denied</p>
                    <p className="text-red-200 text-xs mb-3">
                      You tried to login as <strong>{lastAttemptedRole}</strong>, but this account is registered as <strong>{userActualRole}</strong>.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCorrectRole}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                      >
                        Switch to {userActualRole}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account Type Notice for Signup */}
            {!isLogin && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-300 text-sm font-medium">Account Security</p>
                    <p className="text-blue-200 text-xs mt-1">
                      Your account will be permanently assigned to the {role} role. 
                      This cannot be changed later for security reasons.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isLogin ? `Sign In as ${role}` : `Create ${role} Account`)}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setShowRoleMismatchWarning(false); // Clear warning when switching modes
              }}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;