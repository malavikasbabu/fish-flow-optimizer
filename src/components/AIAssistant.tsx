import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MessageCircle, Send, Bot, User, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  suggestions?: string[];
}

interface AIAssistantProps {
  context?: any;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AIAssistant = ({ context, isOpen, onOpenChange }: AIAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your Cold Chain AI Assistant. I can help you optimize routes, analyze spoilage patterns, and provide insights about your logistics operations. What would you like to know?",
      role: 'assistant',
      timestamp: new Date(),
      suggestions: [
        "What's the most profitable route today?",
        "Why is spoilage high for sardines?",
        "Show me upcoming market trends",
        "How can I reduce transport costs?"
      ]
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Route optimization queries
    if (lowerMessage.includes('profitable') || lowerMessage.includes('profit')) {
      return "Based on current market data, the Chennai to Bangalore route for Pomfret shows the highest profit margin at ₹45,000 net profit. This route has only 8% spoilage due to refrigerated transport and high market demand. I recommend increasing volume on this route if possible.";
    }
    
    if (lowerMessage.includes('spoilage') && lowerMessage.includes('sardine')) {
      return "Sardines have high spoilage rates because they're highly perishable fish with a short shelf life. They spoil 40% faster than other fish types. To reduce spoilage: 1) Use refrigerated trucks exclusively, 2) Minimize travel time, 3) Consider intermediate cold storage for routes >8 hours, 4) Prioritize nearby markets like Chennai or Coimbatore.";
    }
    
    if (lowerMessage.includes('trend') || lowerMessage.includes('market')) {
      return "Market trends show: 1) Pomfret demand is up 25% in Bangalore this week, 2) Tuna prices are expected to rise 15% due to seasonal factors, 3) Mumbai market is showing increased demand for refrigerated fish, 4) Weather forecast suggests using more cold storage in the next 3 days due to high temperatures.";
    }
    
    if (lowerMessage.includes('cost') || lowerMessage.includes('reduce')) {
      return "To reduce transport costs: 1) Consolidate shipments to maximize truck capacity, 2) Use regular trucks for short distances (<4 hours), 3) Negotiate better rates with frequent routes, 4) Consider rail transport for long distances, 5) Optimize routes to avoid traffic congestion during peak hours.";
    }
    
    if (lowerMessage.includes('weather') || lowerMessage.includes('temperature')) {
      return "Weather impact analysis: Current temperature is 32°C, which increases spoilage rates by 15%. I recommend: 1) Using refrigerated transport for all routes today, 2) Adding cold storage stops for journeys >6 hours, 3) Avoiding afternoon departures (12-4 PM), 4) Consider early morning or evening departures.";
    }
    
    if (lowerMessage.includes('route') && lowerMessage.includes('best')) {
      return "Top 3 recommended routes right now: 1) Cochin → Mumbai (Tuna) - ₹52K profit, 12% spoilage, 2) Chennai → Bangalore (Pomfret) - ₹45K profit, 8% spoilage, 3) Vizag → Hyderabad (Tilapia) - ₹38K profit, 5% spoilage. All use refrigerated transport.";
    }
    
    if (lowerMessage.includes('cold storage') || lowerMessage.includes('storage')) {
      return "Cold storage optimization: Hyderabad Cold Hub is at 85% capacity and costs ₹30/hour. For routes >12 hours, cold storage reduces spoilage by 60% but adds ₹2,400 cost. It's profitable when shipment value >₹50,000. Consider Bangalore facility for southern routes.";
    }
    
    // Default responses
    const defaultResponses = [
      "I can help you analyze that data. Could you be more specific about which aspect of your cold chain operations you'd like me to focus on?",
      "Based on your current operations, I notice some optimization opportunities. Would you like me to analyze your routes, costs, or spoilage patterns?",
      "Let me analyze your logistics data. I can provide insights on profitability, spoilage reduction, or market demand patterns. What interests you most?",
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const aiResponse = generateAIResponse(input);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date(),
        suggestions: [
          "Analyze this route further",
          "Show me alternatives",
          "What about weather impact?",
          "Compare with other options"
        ]
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const AssistantContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b">
        <Bot className="h-6 w-6 text-blue-600" />
        <div>
          <h3 className="font-semibold">AI Logistics Assistant</h3>
          <p className="text-xs text-gray-500">Powered by Cold Chain Intelligence</p>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <Bot className="h-8 w-8 p-1.5 bg-blue-100 text-blue-600 rounded-full" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
                
                {message.suggestions && message.role === 'assistant' && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium opacity-80">Quick actions:</p>
                    {message.suggestions.map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="text-xs h-6 mr-1 mb-1"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              
              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <User className="h-8 w-8 p-1.5 bg-gray-100 text-gray-600 rounded-full" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-3">
              <Bot className="h-8 w-8 p-1.5 bg-blue-100 text-blue-600 rounded-full" />
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about routes, spoilage, costs, or market trends..."
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-1 mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => handleSuggestionClick("What's the most profitable route?")}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Profit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => handleSuggestionClick("How to reduce spoilage?")}
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Spoilage
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => handleSuggestionClick("Show market trends")}
          >
            <Lightbulb className="h-3 w-3 mr-1" />
            Trends
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50">
          <MessageCircle className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[500px] p-0">
        <AssistantContent />
      </SheetContent>
    </Sheet>
  );
};

export default AIAssistant;