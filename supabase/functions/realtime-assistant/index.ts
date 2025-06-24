
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`${new Date().toISOString()} - Received ${req.method} request`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  // Handle WebSocket upgrade
  if (req.headers.get("upgrade") !== "websocket") {
    console.log('Request is not a WebSocket upgrade, returning 400');
    return new Response("Expected websocket", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  if (!openAIApiKey) {
    console.error('OpenAI API key not configured');
    return new Response("OpenAI API key not configured", { 
      status: 500,
      headers: corsHeaders 
    });
  }

  console.log('Upgrading to WebSocket connection');
  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = async () => {
    console.log("Client connected to voice assistant");
    
    try {
      // Connect to OpenAI Realtime API
      console.log("Connecting to OpenAI Realtime API...");
      const openAIWs = new WebSocket(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
        {
          headers: {
            "Authorization": `Bearer ${openAIApiKey}`,
            "OpenAI-Beta": "realtime=v1"
          }
        }
      );

      openAIWs.onopen = () => {
        console.log("Connected to OpenAI Realtime API successfully");
      };

      // Forward messages from client to OpenAI
      socket.onmessage = (event) => {
        try {
          const messageData = JSON.parse(event.data);
          console.log("Forwarding to OpenAI:", messageData.type);
          
          if (openAIWs.readyState === WebSocket.OPEN) {
            openAIWs.send(event.data);
          } else {
            console.log("OpenAI WebSocket not ready, state:", openAIWs.readyState);
            socket.send(JSON.stringify({
              type: 'error',
              error: { message: 'OpenAI connection not ready' }
            }));
          }
        } catch (error) {
          console.error("Error forwarding message to OpenAI:", error);
          socket.send(JSON.stringify({
            type: 'error',
            error: { message: 'Failed to forward message' }
          }));
        }
      };

      // Forward messages from OpenAI to client
      openAIWs.onmessage = (event) => {
        try {
          const messageData = JSON.parse(event.data);
          console.log("Forwarding to client:", messageData.type);
          
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          } else {
            console.log("Client WebSocket not ready, state:", socket.readyState);
          }
        } catch (error) {
          console.error("Error forwarding message to client:", error);
        }
      };

      openAIWs.onclose = (event) => {
        console.log("OpenAI connection closed:", event.code, event.reason);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'error',
            error: { message: 'OpenAI connection closed' }
          }));
          socket.close();
        }
      };

      openAIWs.onerror = (error) => {
        console.error("OpenAI WebSocket error:", error);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'error',
            error: { message: 'OpenAI connection error' }
          }));
          socket.close();
        }
      };

      socket.onclose = () => {
        console.log("Client disconnected");
        if (openAIWs.readyState === WebSocket.OPEN) {
          openAIWs.close();
        }
      };

      socket.onerror = (error) => {
        console.error("Client WebSocket error:", error);
        if (openAIWs.readyState === WebSocket.OPEN) {
          openAIWs.close();
        }
      };

    } catch (error) {
      console.error("Error setting up OpenAI connection:", error);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'error',
          error: { message: 'Failed to connect to OpenAI' }
        }));
        socket.close();
      }
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket error during connection:", error);
  };

  return response;
});
