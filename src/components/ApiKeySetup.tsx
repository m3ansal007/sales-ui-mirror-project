
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, ExternalLink } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';

export const ApiKeySetup = () => {
  const { apiKey, setApiKey } = useChat();
  const [tempKey, setTempKey] = useState(apiKey);
  const [isEditing, setIsEditing] = useState(!apiKey);

  const handleSave = () => {
    setApiKey(tempKey);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setTempKey(apiKey);
    setIsEditing(true);
  };

  if (!isEditing && apiKey) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Key className="w-4 h-4" />
        <span>API Key configured</span>
        <Button variant="ghost" size="sm" onClick={handleEdit}>
          Edit
        </Button>
      </div>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Key className="w-5 h-5" />
          OpenAI API Key Required
        </CardTitle>
        <CardDescription>
          Enter your OpenAI API key to enable ChatGPT integration. 
          <a 
            href="https://platform.openai.com/api-keys" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 ml-1 inline-flex items-center gap-1"
          >
            Get your API key here
            <ExternalLink className="w-3 h-3" />
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="password"
          placeholder="sk-..."
          value={tempKey}
          onChange={(e) => setTempKey(e.target.value)}
          className="bg-slate-700 border-slate-600 text-white"
        />
        <Button onClick={handleSave} disabled={!tempKey.trim()}>
          Save API Key
        </Button>
      </CardContent>
    </Card>
  );
};
