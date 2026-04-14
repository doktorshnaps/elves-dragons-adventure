import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const SOURCES = ['all', 'error_boundary', 'unhandled_rejection', 'window_error', 'api_error'] as const;

export const ErrorLogsViewer = () => {
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['errorLogs', sourceFilter],
    queryFn: async () => {
      let query = supabase
        .from('client_error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (sourceFilter !== 'all') {
        query = query.eq('error_source', sourceFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30_000,
  });

  const filteredLogs = search
    ? logs.filter((l: any) =>
        l.error_message?.toLowerCase().includes(search.toLowerCase()) ||
        l.wallet_address?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const handleClearOld = async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('client_error_logs')
      .delete()
      .lt('created_at', sevenDaysAgo);

    if (error) {
      toast.error('Ошибка при очистке: ' + error.message);
    } else {
      toast.success('Старые логи удалены');
      queryClient.invalidateQueries({ queryKey: ['errorLogs'] });
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const sourceColor: Record<string, string> = {
    error_boundary: 'bg-red-500/20 text-red-400',
    unhandled_rejection: 'bg-orange-500/20 text-orange-400',
    window_error: 'bg-yellow-500/20 text-yellow-400',
    api_error: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <Card className="p-4 bg-black/50 border-white/20 text-white space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">🐛 Логи ошибок клиентов</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1">
            <RefreshCw className="h-3 w-3" /> Обновить
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClearOld} className="gap-1">
            <Trash2 className="h-3 w-3" /> Очистить {'>'} 7 дн
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Поиск по сообщению или кошельку..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white/10 border-white/20 text-white"
        />
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCES.map((s) => (
              <SelectItem key={s} value={s}>{s === 'all' ? 'Все источники' : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-gray-400">Загрузка...</p>
      ) : filteredLogs.length === 0 ? (
        <p className="text-gray-400">Ошибок не найдено ✨</p>
      ) : (
        <div className="space-y-1 max-h-[600px] overflow-y-auto">
          {filteredLogs.map((log: any) => (
            <div key={log.id} className="border border-white/10 rounded p-2 hover:bg-white/5">
              <div
                className="flex items-center gap-2 cursor-pointer text-sm"
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
              >
                {expandedId === log.id ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                <span className="text-gray-400 shrink-0 w-32">{formatTime(log.created_at)}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs shrink-0 ${sourceColor[log.error_source] || 'bg-gray-500/20 text-gray-400'}`}>
                  {log.error_source}
                </span>
                <span className="truncate flex-1 text-gray-200">{log.error_message}</span>
                {log.wallet_address && (
                  <span className="text-gray-500 text-xs shrink-0">
                    {log.wallet_address.substring(0, 10)}...
                  </span>
                )}
              </div>
              {expandedId === log.id && (
                <div className="mt-2 ml-5 space-y-2 text-xs">
                  {log.wallet_address && <p><span className="text-gray-400">Кошелёк:</span> {log.wallet_address}</p>}
                  {log.page_url && <p><span className="text-gray-400">Страница:</span> {log.page_url}</p>}
                  {log.user_agent && <p className="text-gray-500 truncate">{log.user_agent}</p>}
                  {log.error_stack && (
                    <pre className="bg-black/50 p-2 rounded overflow-x-auto text-red-300 whitespace-pre-wrap max-h-48">
                      {log.error_stack}
                    </pre>
                  )}
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <pre className="bg-black/50 p-2 rounded overflow-x-auto text-blue-300">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-gray-500 text-xs">Авто-обновление каждые 30 сек. Показано {filteredLogs.length} записей.</p>
    </Card>
  );
};
