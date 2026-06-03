import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LogIn, UserPlus } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { useToast } from "@/hooks/use-toast";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Login() {
  const { t } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, nomeEmpresa);
        toast({
          title: t("login.accountCreatedTitle"),
          description: t("login.accountCreatedDescription"),
        });
      } else {
        await signIn(email, password);
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-24 h-24">
            <img src={logo} alt="DigitalSignageOS Logo" className="w-24 h-24 rounded-2xl shadow-2xl shadow-teal-500/25 object-contain" />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-foreground">digital</span>
              <span className="text-teal-600 dark:text-teal-400">signage</span>
              <span className="text-foreground">os</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1.5 font-semibold">
              {t("login.tagline")}
            </p>
          </div>
        </div>

        <Card className="border-border/50 shadow-2xl shadow-black/10">
          <CardHeader className="text-center pb-2 pt-6">
            <p className="text-sm font-semibold">{isSignUp ? t("login.signUpTitle") : t("login.signInTitle")}</p>
            <p className="text-xs text-muted-foreground">
              {isSignUp ? t("login.signUpSubtitle") : t("login.signInSubtitle")}
            </p>
          </CardHeader>
          <CardContent className="pb-6">
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {isSignUp && (
                <Input
                  placeholder={t("login.companyPlaceholder")}
                  value={nomeEmpresa}
                  onChange={(e) => setNomeEmpresa(e.target.value)}
                  required
                />
              )}
              <Input
                type="email"
                placeholder={t("login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder={t("login.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <Button
                type="submit"
                className="w-full bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-700 text-white"
                disabled={loading}
              >
                {loading ? t("login.loadingButton") : isSignUp ? (
                  <><UserPlus className="mr-2 h-4 w-4" /> {t("login.signUpButton")}</>
                ) : (
                  <><LogIn className="mr-2 h-4 w-4" /> {t("login.signInButton")}</>
                )}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setIsSignUp(!isSignUp)}>
                {isSignUp ? t("login.toggleToSignIn") : t("login.toggleToSignUp")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground/40 uppercase tracking-widest">
          {t("login.copyright")}
        </p>
      </div>
    </div>
  );
}
