import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LogIn, UserPlus } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
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
        toast({ title: "Conta criada!", description: "Verifique seu email para confirmar." });
      } else {
        await signIn(email, password);
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Logo & Brand */}
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
              Plataforma de Publicidade & Propaganda
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-border/50 shadow-2xl shadow-black/10">
          <CardHeader className="text-center pb-2 pt-6">
            <p className="text-sm font-semibold">{isSignUp ? "Crie sua conta" : "Acesse sua conta"}</p>
            <p className="text-xs text-muted-foreground">
              {isSignUp ? "Preencha os dados para começar" : "Entre com suas credenciais"}
            </p>
          </CardHeader>
          <CardContent className="pb-6">
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {isSignUp && (
                <Input
                  placeholder="Nome da Empresa"
                  value={nomeEmpresa}
                  onChange={(e) => setNomeEmpresa(e.target.value)}
                  required
                />
              )}
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Senha"
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
                {loading ? "Carregando..." : isSignUp ? (
                  <><UserPlus className="mr-2 h-4 w-4" /> Criar Conta</>
                ) : (
                  <><LogIn className="mr-2 h-4 w-4" /> Entrar</>
                )}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setIsSignUp(!isSignUp)}>
                {isSignUp ? "Já tem conta? Entrar" : "Não tem conta? Criar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground/40 uppercase tracking-widest">
          © 2026 DigitalSignageOS · Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
