import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Target, Eye, EyeOff, User, Shield, AlertTriangle, Info } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Sales Associate');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const [roleError, setRoleError] = useState('');
  const [userActualRole, setUserActualRole] = useState('');
  const [preventSubmit, setPreventSubmit] = useState(false);
  const [roleCheckUnavailable, setRoleCheckUnavailable] = useState(false);
  
  const { signIn, signUp, user, checkUserRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Function to check user role before authentication
  const checkRoleBeforeAuth = async (email: string, selectedRole: string) => {
    if (!email || !isLogin) return { canProceed: true };

    setIsCheckingRole(true);
    setRoleError(''); // Clear any previous role errors
    setPreventSubmit(false);
    setRoleCheckUnavailable(false);
    
    try {
      console.log('Checking role for email:', email, 'selected role:', selectedRole);
      
      const { role: actualRole, error } = await checkUserRole(email);
      
      if (error) {
        // Check if this is a configuration error
        if (error.type === 'CONFIG_ERROR') {
          setRoleCheckUnavailable(true);
          toast({
            title: "⚠️ Role Verification Unavailable",
            description: "Role verification is temporarily unavailable. You can still login, but please ensure you're selecting the correct role.",
            variant: "default",
          });
          return { canProceed: true };
        }
        
        console.log('Could not verify role, proceeding with authentication:', error);
        return { canProceed: true };
      }

      console.log('Actual role from server:', actualRole);

      if (actualRole && actualRole !== selectedRole) {
        // Role mismatch detected - show error and prevent authentication
        setUserActualRole(actualRole);
        setRoleError(`❌ Wrong role selected! This account is registered as ${actualRole}, not ${selectedRole}.`);
        setPreventSubmit(true); // Prevent form submission
        
        toast({
          title: "🚫 Access Denied - Wrong Role",
          description: `This account is registered as ${actualRole}. Please select the correct role.`,
          variant: "destructive",
        });
        
        return { canProceed: false, actualRole, attemptedRole: selectedRole };
      }

      return { canProceed: true };
    } catch (error) {
      console.error('Error checking role:', error);
      
      // If it's a network error, allow authentication to proceed with a warning
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setRoleCheckUnavailable(true);
        toast({
          title: "⚠️ Role Verification Unavailable",
          description: "Cannot verify role due to network issues. You can still login, but please ensure you're selecting the correct role.",
          variant: "default",
        });
        return { canProceed: true };
      }
      
      setRoleError('⚠️ Could not verify role. Please try again.');
      setPreventSubmit(true);
      return { canProceed: false }; // Don't allow authentication if role check fails
    } finally {
      setIsCheckingRole(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent any event bubbling that might cause page reload
    
    // If there's a role error or we're preventing submit, don't proceed
    if (preventSubmit || roleError) {
      console.log('Form submission prevented due to role error');
      return;
    }
    
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

    // Clear any previous role errors
    setRoleError('');
    setPreventSubmit(false);

    // For login, check role before authentication
    if (isLogin) {
      try {
        const roleCheck = await checkRoleBeforeAuth(email, role);
        
        if (!roleCheck.canProceed) {
          // Role mismatch detected - do not proceed with authentication
          // Error message is already set in checkRoleBeforeAuth
          console.log('Role check failed, not proceeding with authentication');
          return;
        }
      } catch (error) {
        console.error('Role check failed:', error);
        setRoleError('⚠️ Could not verify role. Please try again.');
        setPreventSubmit(true);
        return;
      }
    }

    setLoading(true);

    try {
      let result;
      if (isLogin) {
        // For login, we've already verified the role above
        result = await signIn(email, password, role);
      } else {
        // For signup, register with the selected role
        result = await signUp(email, password, fullName, role);
      }

      if (result.error) {
        // Handle any remaining authentication errors
        if (result.error.code === 'ROLE_MISMATCH') {
          // This shouldn't happen since we check before, but just in case
          setUserActualRole(result.error.actualRole);
          setRoleError(`❌ Wrong role selected! This account is registered as ${result.error.actualRole}, not ${result.error.attemptedRole}.`);
          setPreventSubmit(true);
        }
        
        toast({
          title: "Authentication Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        // Clear any errors on successful login/signup
        setRoleError('');
        setPreventSubmit(false);
        
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
      console.error('Authentication error:', error);
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
    // Clear role error when user changes role
    if (roleError) {
      setRoleError('');
      setUserActualRole('');
      setPreventSubmit(false);
    }
    // Clear role check unavailable warning
    setRoleCheckUnavailable(false);
  };

  const handleCorrectRole = () => {
    setRole(userActualRole);
    setRoleError('');
    setPreventSubmit(false);
    toast({
      title: "Role Updated",
      description: `Switched to ${userActualRole}. You can now login.`,
    });
  };

  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    setRoleError(''); // Clear role error when switching modes
    setUserActualRole('');
    setPreventSubmit(false);
    setRoleCheckUnavailable(false);
    setEmail('');
    setPassword('');
    setFullName('');
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
                  disabled={loading || isCheckingRole}
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
                disabled={loading || isCheckingRole}
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
                  disabled={loading || isCheckingRole}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  disabled={loading || isCheckingRole}
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
                  className={`w-full bg-slate-800 border rounded-lg pl-10 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    roleError ? 'border-red-500 border-2' : 'border-slate-700'
                  }`}
                  required
                  disabled={isCheckingRole || loading}
                >
                  <option value="Admin">{getRoleIcon('Admin')} Admin</option>
                  <option value="Sales Manager">{getRoleIcon('Sales Manager')} Sales Manager</option>
                  <option value="Sales Associate">{getRoleIcon('Sales Associate')} Sales Associate</option>
                </select>
              </div>
              
              {/* Role Check Unavailable Warning */}
              {roleCheckUnavailable && !roleError && (
                <div className="mt-2 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-yellow-200 text-sm font-medium">Role Verification Unavailable</p>
                      <p className="text-yellow-100 text-xs mt-1">
                        Cannot verify your role at the moment. Please ensure you're selecting the correct role for your account.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Role Error Message - Shows directly under the role selection and STAYS VISIBLE */}
              {roleError && (
                <div className="mt-2 p-4 bg-red-500/20 border-2 border-red-500/50 rounded-lg animate-in fade-in duration-300 sticky">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-200 text-sm font-bold mb-2">🚫 Access Denied - Wrong Role Selected</p>
                      <p className="text-red-100 text-sm mb-3">{roleError}</p>
                      <p className="text-red-200 text-xs mb-3">
                        Please select the correct role below or contact your administrator if you believe this is an error.
                      </p>
                      {userActualRole && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleCorrectRole}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors font-medium"
                          >
                            ✅ Switch to {userActualRole}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRoleError('');
                              setUserActualRole('');
                              setPreventSubmit(false);
                            }}
                            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Role checking indicator */}
              {isCheckingRole && (
                <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-blue-300 text-sm">Verifying role...</p>
                  </div>
                </div>
              )}
              
              {/* Role description - only show if no error */}
              {!roleError && !isCheckingRole && !roleCheckUnavailable && (
                <div className="mt-2 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                  <p className="text-xs text-slate-300">
                    {getRoleDescription(role)}
                  </p>
                </div>
              )}
            </div>

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
              disabled={loading || isCheckingRole || preventSubmit}
              className={`w-full py-2 px-4 rounded-lg transition-colors ${
                preventSubmit || roleError 
                  ? 'bg-red-600 hover:bg-red-700 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white disabled:opacity-50`}
            >
              {loading ? 'Processing...' : 
               isCheckingRole ? 'Verifying Role...' :
               preventSubmit || roleError ? '🚫 Please Fix Role Selection First' :
               (isLogin ? `Sign In as ${role}` : `Create ${role} Account`)}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleModeSwitch}
              className="text-blue-400 hover:text-blue-300 transition-colors"
              disabled={loading || isCheckingRole}
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