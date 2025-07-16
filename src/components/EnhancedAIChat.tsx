
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageCircle, Send, Bot, User, Loader2, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'insight' | 'warning' | 'recommendation';
}

interface EnhancedAIChatProps {
  isOpen?: boolean;
  onClose?: () => void;
  context?: {
    results?: any[];
    selectedResult?: any;
    formData?: any;
    emergencyMode?: boolean;
    sustainabilityMetrics?: any;
  };
}

const EnhancedAIChat = ({ isOpen, onClose, context }: EnhancedAIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState<string[]>([]);

  // Smart suggested questions based on context
  const getSmartSuggestions = () => {
    const baseQuestions = [
      "How can I reduce fish spoilage during transport?",
      "What's the optimal temperature for different fish types?",
      "How do I calculate ROI for refrigerated trucks?",
      "Best practices for emergency deliveries?",
      "How to optimize for multiple deliveries?",
      "What certifications are needed for fish transport?"
    ];

    const contextualQuestions = [];
    
    if (context?.selectedResult) {
      const result = context.selectedResult;
      if (result.spoilage > 10) {
        contextualQuestions.push(`Why is spoilage ${result.spoilage?.toFixed(1)}% so high?`);
        contextualQuestions.push("How can I reduce spoilage for this route?");
      }
      
      if (result.sustainability_score < 70) {
        contextualQuestions.push("How can I make this route more sustainable?");
      }
      
      if (result.profit < 5000) {
        contextualQuestions.push("How can I improve profitability?");
      }
      
      contextualQuestions.push("Compare this route with alternatives");
      contextualQuestions.push("What are the biggest cost drivers?");
    }

    if (context?.emergencyMode) {
      contextualQuestions.push("Best emergency delivery strategies");
      contextualQuestions.push("How to minimize delays in emergencies?");
    }

    return [...contextualQuestions, ...baseQuestions].slice(0, 8);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build enhanced context
      let enhancedMessage = content.trim();
      let systemContext = "You are an expert AI consultant specializing in fish supply chain management and cold chain logistics. ";
      
      if (context?.selectedResult) {
        const result = context.selectedResult;
        systemContext += `\n\nCurrent optimization context:
- Route: ${result.route}
- Distance: ${result.distance?.toFixed(0)}km
- Spoilage: ${result.spoilage?.toFixed(1)}%
- Profit: ₹${result.profit?.toLocaleString()}
- Truck type: ${result.truck?.truck_type}
- Fish type: ${context.formData?.fish_type}
- Volume: ${context.formData?.volume_kg}kg`;

        if (result.sustainability_score) {
          systemContext += `\n- Sustainability score: ${result.sustainability_score}/100`;
        }
        
        if (result.carbon_footprint) {
          systemContext += `\n- Carbon footprint: ${result.carbon_footprint?.toFixed(1)}kg CO₂`;
        }
      }

      if (context?.emergencyMode) {
        systemContext += "\n- EMERGENCY MODE: User needs urgent delivery solutions";
      }

      // Add conversation memory
      if (conversationContext.length > 0) {
        systemContext += `\n\nPrevious conversation topics: ${conversationContext.join(', ')}`;
      }

      enhancedMessage = systemContext + "\n\nUser question: " + enhancedMessage;

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { message: enhancedMessage }
      });

      if (error) throw error;

      // Determine message type based on content
      let messageType: 'insight' | 'warning' | 'recommendation' | undefined;
      const response = data.response.toLowerCase();
      if (response.includes('recommend') || response.includes('suggest')) {
        messageType = 'recommendation';
      } else if (response.includes('warning') || response.includes('risk') || response.includes('danger')) {
        messageType = 'warning';
      } else if (response.includes('insight') || response.includes('analysis') || response.includes('key factor')) {
        messageType = 'insight';
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        isUser: false,
        timestamp: new Date(),
        type: messageType
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Update conversation context
      setConversationContext(prev => [
        ...prev.slice(-4), // Keep last 5 topics
        content.toLowerCase().split(' ').slice(0, 3).join(' ')
      ]);

    } catch (error) {
      console.error('AI Chat error:', error);
      toast.error('Failed to get AI response. Please try again.');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm experiencing some technical difficulties. Please try rephrasing your question or check back in a moment.",
        isUser: false,
        timestamp: new Date(),
        type: 'warning'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'insight':
        return <Lightbulb className="h-4 w-4 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'recommendation':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      default:
        return <Bot className="h-4 w-4 text-blue-600" />;
    }
  };

  const ChatContent = () => (
    <div className="flex flex-col h-full space-y-4">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">Smart Fish Logistics AI</p>
            <p className="text-sm mb-4">Ask me anything about supply chain optimization, spoilage prevention, or route planning.</p>
            
            {context?.selectedResult && (
              <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 mb-4">
                <p className="font-medium">Context Loaded:</p>
                <p>Analyzing route from {context.selectedResult.route} with {context.selectedResult.spoilage?.toFixed(1)}% spoilage</p>
              </div>
            )}
            
            {context?.emergencyMode && (
              <div className="bg-red-50 p-3 rounded-lg text-xs text-red-800">
                <p className="font-medium">🚨 Emergency Mode Active</p>
                <p>Priority on speed and urgent delivery solutions</p>
              </div>
            )}
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.isUser
                  ? 'bg-blue-600 text-white'
                  : `bg-white border shadow-sm ${
                      message.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                      message.type === 'insight' ? 'border-blue-200 bg-blue-50' :
                      message.type === 'recommendation' ? 'border-green-200 bg-green-50' :
                      'border-gray-200'
                    }`
              }`}
            >
              <div className="flex items-start space-x-2">
                {!message.isUser && getMessageIcon(message.type)}
                {message.isUser && <User className="h-4 w-4 mt-1" />}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.isUser ? 'text-blue-100' : 
                    message.type ? 'text-gray-600' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border shadow-sm p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4 text-blue-600" />
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                <span className="text-sm text-gray-500">Analyzing your request...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Smart Suggested Questions */}
      {messages.length === 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Smart suggestions based on your data:</p>
          <div className="flex flex-wrap gap-2">
            {getSmartSuggestions().map((question, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors text-xs"
                onClick={() => handleSuggestedQuestion(question)}
              >
                {question}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask about optimization, spoilage, costs, sustainability..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );

  // If used as modal
  if (isOpen !== undefined && onClose) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <span>Smart Fish Logistics AI</span>
              {context?.emergencyMode && (
                <Badge className="bg-red-100 text-red-800 text-xs">Emergency Mode</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ChatContent />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Standalone version
  return (
    <Card className="w-full max-w-4xl mx-auto h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <span>Smart Fish Logistics AI</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <ChatContent />
      </CardContent>
    </Card>
  );
};

export default EnhancedAIChat;
