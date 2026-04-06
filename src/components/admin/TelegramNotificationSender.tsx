import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Users, User, Image, Eye, Bold, Italic, Underline, Code, Link } from "lucide-react";

const HTML_HELPERS = [
  { icon: Bold, tag: "b", label: "Жирный" },
  { icon: Italic, tag: "i", label: "Курсив" },
  { icon: Underline, tag: "u", label: "Подчёркнутый" },
  { icon: Code, tag: "code", label: "Код" },
];

export const TelegramNotificationSender = () => {
  const { toast } = useToast();
  const { accountId } = useWalletContext();
  const [loading, setSending] = useState(false);
  const [mode, setMode] = useState<"broadcast" | "targeted">("broadcast");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [chatIdsInput, setChatIdsInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [lastResult, setLastResult] = useState<{
    sent: number;
    failed: number;
    total: number;
    errors?: { chat_id: number; error: string }[];
  } | null>(null);

  const insertTag = (tag: string) => {
    const textarea = document.querySelector<HTMLTextAreaElement>("#notification-message");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.substring(start, end);
    const newText =
      message.substring(0, start) +
      `<${tag}>${selectedText}</${tag}>` +
      message.substring(end);
    setMessage(newText);

    setTimeout(() => {
      textarea.focus();
      const cursorPos = selectedText
        ? start + tag.length + 2 + selectedText.length + tag.length + 3
        : start + tag.length + 2;
      textarea.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  const insertLink = () => {
    const url = prompt("Введите URL:");
    if (!url) return;
    const text = prompt("Текст ссылки:") || url;
    const textarea = document.querySelector<HTMLTextAreaElement>("#notification-message");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const linkHtml = `<a href="${url}">${text}</a>`;
    const newText = message.substring(0, start) + linkHtml + message.substring(start);
    setMessage(newText);
  };

  const parseChatIds = (): number[] => {
    return chatIdsInput
      .split(/[,\s\n]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);
  };

  const sendNotification = async () => {
    if (!message.trim()) {
      toast({ title: "Ошибка", description: "Введите текст сообщения", variant: "destructive" });
      return;
    }
    if (!accountId) {
      toast({ title: "Ошибка", description: "Кошелёк не подключен", variant: "destructive" });
      return;
    }

    const targetChatIds = mode === "targeted" ? parseChatIds() : undefined;

    if (mode === "targeted" && (!targetChatIds || targetChatIds.length === 0)) {
      toast({ title: "Ошибка", description: "Введите хотя бы один chat_id", variant: "destructive" });
      return;
    }

    if (mode === "broadcast") {
      const confirmed = confirm(
        "Вы уверены, что хотите отправить уведомление ВСЕМ игрокам с подключённым Telegram?"
      );
      if (!confirmed) return;
    }

    try {
      setSending(true);
      setLastResult(null);

      const { data, error } = await supabase.functions.invoke("admin-send-notification", {
        body: {
          admin_wallet: accountId,
          message: message.trim(),
          image_url: imageUrl.trim() || undefined,
          target_chat_ids: targetChatIds,
        },
      });

      if (error) throw error;

      setLastResult(data);

      if (data.sent > 0) {
        toast({
          title: "Отправлено",
          description: `Доставлено: ${data.sent}/${data.total}${data.failed > 0 ? `, ошибок: ${data.failed}` : ""}`,
        });
      } else {
        toast({
          title: "Предупреждение",
          description: data.message || "Не удалось доставить ни одного сообщения",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить уведомление",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Simple HTML to text preview (strip tags for display)
  const previewHtml = message
    .replace(/\n/g, "<br/>")
    .replace(/</g, "&lt;")
    .replace(/&gt;/g, ">")
    // Re-allow safe HTML tags for preview
    .replace(/&lt;(\/?(b|i|u|s|code|pre|a)[^>]*)&gt;/gi, "<$1>");

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Отправка уведомлений в Telegram
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Mode selector */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as "broadcast" | "targeted")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="broadcast" className="gap-2">
                <Users className="h-4 w-4" />
                Всем игрокам
              </TabsTrigger>
              <TabsTrigger value="targeted" className="gap-2">
                <User className="h-4 w-4" />
                По chat_id
              </TabsTrigger>
            </TabsList>

            <TabsContent value="targeted" className="mt-4">
              <div>
                <Label htmlFor="chat-ids">Chat ID (через запятую или каждый с новой строки)</Label>
                <Textarea
                  id="chat-ids"
                  placeholder="1039079162, 123456789..."
                  value={chatIdsInput}
                  onChange={(e) => setChatIdsInput(e.target.value)}
                  className="mt-1 h-20 font-mono text-sm"
                />
                {chatIdsInput && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Найдено ID: {parseChatIds().length}
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="broadcast" className="mt-4">
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-sm text-yellow-200">
                  ⚠️ Сообщение будет отправлено <strong>всем</strong> игрокам, у которых подключён Telegram.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Message input */}
          <div>
            <Label htmlFor="notification-message">Текст сообщения (HTML)</Label>
            <div className="flex gap-1 mt-1 mb-2 flex-wrap">
              {HTML_HELPERS.map(({ icon: Icon, tag, label }) => (
                <Button
                  key={tag}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => insertTag(tag)}
                  title={label}
                >
                  <Icon className="h-3.5 w-3.5" />
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={insertLink}
                title="Ссылка"
              >
                <Link className="h-3.5 w-3.5" />
              </Button>
              <div className="flex-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-3.5 w-3.5" />
                {showPreview ? "Скрыть" : "Предпросмотр"}
              </Button>
            </div>
            <Textarea
              id="notification-message"
              placeholder="🔔 <b>Важное обновление!</b>&#10;&#10;Текст уведомления..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length}/4096 · Поддерживается HTML: &lt;b&gt;, &lt;i&gt;, &lt;u&gt;, &lt;code&gt;, &lt;a href=&quot;...&quot;&gt;
            </p>
          </div>

          {/* Preview */}
          {showPreview && message && (
            <div className="p-4 rounded-lg bg-[#1a2332] border border-white/10">
              <p className="text-xs text-muted-foreground mb-2">Предпросмотр (приблизительный):</p>
              <div
                className="text-sm text-white/90 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          )}

          {/* Image URL */}
          <div>
            <Label htmlFor="image-url" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              URL изображения (необязательно)
            </Label>
            <Input
              id="image-url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-1"
            />
            {imageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-white/10 max-w-xs">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-auto max-h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              При наличии изображения текст будет отправлен как подпись к фото (макс. 1024 символа)
            </p>
          </div>

          {/* Send button */}
          <Button
            onClick={sendNotification}
            disabled={loading || !message.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {mode === "broadcast" ? "Отправить всем" : `Отправить (${parseChatIds().length})`}
          </Button>

          {/* Result */}
          {lastResult && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2">
              <div className="flex gap-3">
                <Badge variant="default" className="bg-green-600">
                  ✅ Доставлено: {lastResult.sent}
                </Badge>
                {lastResult.failed > 0 && (
                  <Badge variant="destructive">
                    ❌ Ошибок: {lastResult.failed}
                  </Badge>
                )}
                <Badge variant="secondary">
                  Всего: {lastResult.total}
                </Badge>
              </div>
              {lastResult.errors && lastResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Ошибки:</p>
                  <div className="text-xs font-mono space-y-1 max-h-32 overflow-y-auto">
                    {lastResult.errors.map((err, i) => (
                      <div key={i} className="text-red-400">
                        chat_id {err.chat_id}: {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
