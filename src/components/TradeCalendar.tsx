import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent } from '@/components/ui/card';

const localizer = momentLocalizer(moment);

interface Trade {
  id: string;
  pair: string;
  trade_type: 'buy' | 'sell';
  entry_price: number;
  exit_price?: number;
  lot_size: number;
  status: 'open' | 'closed';
  pnl?: number;
  opened_at: string;
  closed_at?: string;
}

interface TradeCalendarProps {
  trades: Trade[];
}

export default function TradeCalendar({ trades }: TradeCalendarProps) {
  const events = trades.map(trade => ({
    id: trade.id,
    title: `${trade.pair} ${trade.trade_type.toUpperCase()}`,
    start: new Date(trade.opened_at),
    end: trade.closed_at ? new Date(trade.closed_at) : new Date(trade.opened_at),
    resource: trade,
  }));

  const eventStyleGetter = (event: any) => {
    const trade = event.resource;
    let backgroundColor = '#10b981'; // green for buy
    if (trade.trade_type === 'sell') backgroundColor = '#ef4444'; // red for sell
    if (trade.status === 'open') backgroundColor = '#f59e0b'; // amber for open

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '12px',
      }
    };
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-6">
        <div className="h-96">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ 
              height: '100%',
              backgroundColor: 'transparent',
              color: 'white'
            }}
            eventPropGetter={eventStyleGetter}
            views={['month', 'week', 'day']}
            defaultView="month"
            popup
            components={{
              toolbar: (props) => (
                <div className="flex justify-between items-center mb-4 text-white">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => props.onNavigate('PREV')}
                      className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
                    >
                      ←
                    </button>
                    <button 
                      onClick={() => props.onNavigate('NEXT')}
                      className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
                    >
                      →
                    </button>
                    <button 
                      onClick={() => props.onNavigate('TODAY')}
                      className="px-3 py-1 bg-green-600 rounded hover:bg-green-700"
                    >
                      Today
                    </button>
                  </div>
                  <h2 className="text-lg font-semibold">{props.label}</h2>
                  <div className="flex gap-1">
                    {['month', 'week', 'day'].map(view => (
                      <button
                        key={view}
                        onClick={() => props.onView(view as any)}
                        className={`px-3 py-1 rounded capitalize ${
                          props.view === view 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        {view}
                      </button>
                    ))}
                  </div>
                </div>
              )
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}