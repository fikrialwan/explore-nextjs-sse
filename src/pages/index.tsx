import { useState, useEffect, useRef } from 'react';

interface SSEEvent {
  type: string;
  message: string;
  timestamp: string;
}

export default function Home() {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [eventType, setEventType] = useState('update');
  const [isSending, setIsSending] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Connect to SSE endpoint
  useEffect(() => {
    const connectSSE = () => {
      const eventSource = new EventSource('/api/sse');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received event:', data);
          setEvents((prev) => [data, ...prev].slice(0, 50)); // Keep last 50 events
        } catch (error) {
          console.error('Error parsing event data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setIsConnected(false);
        eventSource.close();

        // Reconnect after 3 seconds
        setTimeout(() => {
          console.log('Attempting to reconnect...');
          connectSSE();
        }, 3000);
      };
    };

    connectSSE();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Send event via API
  const handleSendEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/send-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          type: eventType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Event sent:', data);
        setMessage('');
      } else {
        alert(`Error: ${data.error || 'Failed to send event'}`);
      }
    } catch (error) {
      console.error('Error sending event:', error);
      alert('Failed to send event');
    } finally {
      setIsSending(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Server-Sent Events Demo
            </h1>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Send Event Form */}
          <form onSubmit={handleSendEvent} className="space-y-4">
            <div>
              <label
                htmlFor="eventType"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Event Type
              </label>
              <select
                id="eventType"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="update">Update</option>
                <option value="notification">Notification</option>
                <option value="alert">Alert</option>
                <option value="info">Info</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Message
              </label>
              <input
                type="text"
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={isSending}
              />
            </div>

            <button
              type="submit"
              disabled={isSending || !message.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition-colors"
            >
              {isSending ? 'Sending...' : 'Send Event'}
            </button>
          </form>
        </div>

        {/* Events List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Real-time Events ({events.length})
          </h2>

          {events.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No events yet. Send an event to see it appear here in real-time!
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.map((event, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-md p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            event.type === 'alert'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : event.type === 'notification'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : event.type === 'info'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}
                        >
                          {event.type}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(event.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {event.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            How it works
          </h3>
          <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200 text-sm">
            <li>The page is connected to the SSE endpoint at <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">/api/sse</code></li>
            <li>When you send an event, it triggers the API at <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">/api/send-event</code></li>
            <li>The event is broadcast to all connected clients in real-time</li>
            <li>Open this page in multiple tabs to see events appear simultaneously!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
