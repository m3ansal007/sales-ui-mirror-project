
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle WebSocket upgrade
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("Expected websocket", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = async () => {
    console.log("Client connected to voice assistant");
    
    try {
      // Connect to OpenAI Realtime API
      const openAIWs = new WebSocket(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
        {
          headers: {
            "Authorization": `Bearer ${openAIApiKey}`,
            "OpenAI-Beta": "realtime=v1"
          }
        }
      );

      // Forward messages from client to OpenAI
      socket.onmessage = (event) => {
        console.log("Forwarding to OpenAI:", event.data);
        if (openAIWs.readyState === WebSocket.OPEN) {
          openAIWs.send(event.data);
        }
      };

      // Forward messages from OpenAI to client
      openAIWs.onmessage = (event) => {
        console.log("Forwarding to client:", JSON.parse(event.data).type);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(event.data);
        }
      };

      openAIWs.onclose = () => {
        console.log("OpenAI connection closed");
        socket.close();
      };

      openAIWs.onerror = (error) => {
        console.error("OpenAI WebSocket error:", error);
        socket.close();
      };

      socket.onclose = () => {
        console.log("Client disconnected");
        openAIWs.close();
      };

    } catch (error) {
      console.error("Error setting up OpenAI connection:", error);
      socket.close();
    }
  };

  return response;
});
