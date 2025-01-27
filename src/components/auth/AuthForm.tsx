import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface AuthFormProps {
  onSuccess: () => void;
}

export const AuthForm = ({ onSuccess }: AuthFormProps) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleRegister = () => {
    // Validation checks similar to the provided logic
    if (username.length <= 4) {
      toast({
        title: "Ошибка",
        description: "Никнейм слишком мал (минимум 5 символов)",
        variant: "destructive",
      });
      return;
    }

    if (password.length <= 4) {
      toast({
        title: "Ошибка",
        description: "Пароль слишком мал (минимум 5 символов)",
        variant: "destructive",
      });
      return;
    }

    const existingUsers = JSON.parse(localStorage.getItem("gameUsers") || "[]");
    if (existingUsers.some((user: { username: string }) => user.username === username)) {
      toast({
        title: "Ошибка",
        description: "Пользователь уже существует",
        variant: "destructive",
      });
      return;
    }

    const userData = { username, password };
    localStorage.setItem("gameUsers", JSON.stringify([...existingUsers, userData]));
    localStorage.setItem("gameUser", JSON.stringify(userData));
    toast({
      title: "Успешно",
      description: "Регистрация прошла успешно",
    });
    onSuccess();
  };

  const handleLogin = () => {
    const users = JSON.parse(localStorage.getItem("gameUsers") || "[]");
    const user = users.find(
      (u: { username: string; password: string }) =>
        u.username === username && u.password === password
    );

    if (!user) {
      toast({
        title: "Ошибка",
        description: "Неверное имя пользователя или пароль",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("gameUser", JSON.stringify(user));
    toast({
      title: "Успешно",
      description: "Вход выполнен успешно",
    });
    onSuccess();
  };

  return (
    <div className="w-full max-w-md space-y-4 bg-black/40 p-6 rounded-lg backdrop-blur-sm">
      <h2 className="text-2xl font-bold text-center text-white mb-6">
        {isRegistered ? "Вход в игру" : "Регистрация"}
      </h2>
      <div className="space-y-4">
        <Input
          type="text"
          placeholder="Имя пользователя"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="bg-white/10 text-white placeholder:text-gray-400"
        />
        <Input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-white/10 text-white placeholder:text-gray-400"
        />
        <Button
          onClick={isRegistered ? handleLogin : handleRegister}
          className="w-full"
          variant="outline"
        >
          {isRegistered ? "Войти" : "Зарегистрироваться"}
        </Button>
        <Button
          onClick={() => setIsRegistered(!isRegistered)}
          variant="ghost"
          className="w-full text-white hover:text-white hover:bg-white/20"
        >
          {isRegistered ? "Создать новый аккаунт" : "У меня уже есть аккаунт"}
        </Button>
      </div>
    </div>
  );
};