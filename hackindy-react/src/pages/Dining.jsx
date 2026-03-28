import { useState } from 'react'
import Icon from '../components/Icons'

const diningLocations = [
  {
    id: 'tower',
    name: 'Tower Dining',
    status: 'open',
    hours: 'Closes 2:00 PM',
    meal: 'Lunch',
    rating: 4.5,
    entrees: ['Grilled Chicken', 'Pasta Marinara', 'Black Bean Burger', 'Mac & Cheese', 'Beef Stir-Fry'],
    sides: ['Caesar Salad', 'Roasted Veggies', 'Garlic Bread', 'Fresh Fruit'],
    desserts: ['Chocolate Cake', 'Vanilla Ice Cream', 'Cookies'],
  },
  {
    id: 'union',
    name: 'Campus Center Food Court',
    status: 'open',
    hours: 'Closes 8:00 PM',
    meal: 'All Day',
    rating: 4.2,
    entrees: ['Pizza', 'Burgers', 'Sushi', 'Tacos', 'Sandwiches'],
    sides: ['French Fries', 'Onion Rings', 'Cole Slaw'],
    desserts: ['Brownies', 'Fruit Cups'],
  },
  {
    id: 'cafe',
    name: 'Library Café',
    status: 'open',
    hours: 'Closes 10:00 PM',
    meal: 'Coffee & Snacks',
    rating: 4.7,
    entrees: ['Bagels', 'Muffins', 'Breakfast Sandwiches'],
    sides: ['Yogurt Parfait', 'Fruit Cup'],
    desserts: ['Pastries', 'Cookies'],
  },
  {
    id: 'late',
    name: 'Late Night Grill',
    status: 'closed',
    hours: 'Opens 9:00 PM',
    meal: 'Late Night',
    rating: 4.0,
    entrees: ['Burgers', 'Wings', 'Loaded Fries', 'Quesadillas'],
    sides: ['Mozzarella Sticks', 'Nachos'],
    desserts: ['Milkshakes', 'Churros'],
  },
]

const hours = [
  { meal: 'Breakfast', time: '7:00 – 10:30 AM', icon: 'coffee' },
  { meal: 'Lunch', time: '11:00 AM – 2:00 PM', icon: 'dining' },
  { meal: 'Dinner', time: '4:30 – 8:00 PM', icon: 'moon' },
]

export default function Dining() {
  const [selectedLocation, setSelectedLocation] = useState(diningLocations[0])
  const mounted = true

  return (
    <div className={`max-w-[1000px] mx-auto px-6 py-8 pb-24 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-txt-0)]">Campus Dining</h1>
          <p className="text-[14px] text-[var(--color-txt-2)] mt-1">
            See what's being served today
          </p>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-[var(--color-txt-2)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 shadow-sm">
          <Icon name="clock" size={14} className="text-[var(--color-txt-3)]" />
          Lunch service
        </div>
      </div>

      {/* Location Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1 animate-fade-in-up stagger-1">
        {diningLocations.map(loc => {
          const isSelected = selectedLocation.id === loc.id
          return (
            <button
              key={loc.id}
              onClick={() => setSelectedLocation(loc)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border whitespace-nowrap transition-all duration-300
                ${isSelected 
                  ? 'bg-[var(--color-surface)] border-[var(--color-border-2)] shadow-md' 
                  : 'bg-transparent border-transparent hover:bg-[var(--color-surface)] hover:border-[var(--color-border)]'
                }`}
            >
              <div className={`status-dot ${loc.status === 'open' ? 'status-open' : 'status-closed'}`} />
              <span className={`text-[13px] font-medium ${isSelected ? 'text-[var(--color-txt-0)]' : 'text-[var(--color-txt-1)]'}`}>
                {loc.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected Location Details */}
      <div className="card p-6 mb-6 animate-fade-in-up stagger-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-[var(--color-txt-0)]">{selectedLocation.name}</h2>
              <div className="flex items-center gap-1 text-[12px] text-[var(--color-gold-muted)]">
                <Icon name="star" size={12} className="fill-current" />
                {selectedLocation.rating}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`status-dot ${selectedLocation.status === 'open' ? 'status-open' : 'status-closed'}`} />
              <span className="text-[13px] text-[var(--color-txt-2)]">
                {selectedLocation.status === 'open' ? 'Open now' : 'Closed'} · {selectedLocation.meal} · {selectedLocation.hours}
              </span>
            </div>
          </div>
          <button className="btn btn-primary text-[12px] px-4 py-2.5 w-fit">
            <Icon name="mapPin" size={14} />
            Get Directions
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Entrees */}
          <div>
            <div className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[var(--color-dining-bg)] flex items-center justify-center">
                <Icon name="dining" size={12} className="text-[var(--color-dining-color)]" />
              </div>
              Entrées
            </div>
            <div className="space-y-2">
              {selectedLocation.entrees.map(item => (
                <div 
                  key={item}
                  className="text-[13px] bg-[var(--color-stat)] hover:bg-[var(--color-bg-3)] rounded-xl px-4 py-2.5 text-[var(--color-txt-0)] transition-colors cursor-default"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Sides */}
          <div>
            <div className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[var(--color-map-bg)] flex items-center justify-center">
                <Icon name="grid" size={12} className="text-[var(--color-map-color)]" />
              </div>
              Sides & Salads
            </div>
            <div className="space-y-2">
              {selectedLocation.sides.map(item => (
                <div 
                  key={item}
                  className="text-[13px] bg-[var(--color-stat)] hover:bg-[var(--color-bg-3)] rounded-xl px-4 py-2.5 text-[var(--color-txt-0)] transition-colors cursor-default"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Desserts */}
          <div>
            <div className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[var(--color-events-bg)] flex items-center justify-center">
                <Icon name="star" size={12} className="text-[var(--color-events-color)]" />
              </div>
              Desserts
            </div>
            <div className="space-y-2">
              {selectedLocation.desserts.map(item => (
                <div 
                  key={item}
                  className="text-[13px] bg-[var(--color-stat)] hover:bg-[var(--color-bg-3)] rounded-xl px-4 py-2.5 text-[var(--color-txt-0)] transition-colors cursor-default"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hours Section */}
      <div className="card p-6 animate-fade-in-up stagger-3">
        <div className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider mb-4">
          Operating Hours
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {hours.map(({ meal, time, icon }) => (
            <div 
              key={meal}
              className="bg-[var(--color-stat)] rounded-xl p-4 flex items-center gap-4 hover:bg-[var(--color-bg-3)] transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-2)] flex items-center justify-center">
                <Icon name={icon} size={18} className="text-[var(--color-txt-2)]" />
              </div>
              <div>
                <div className="text-[12px] text-[var(--color-txt-2)]">{meal}</div>
                <div className="text-[14px] font-medium text-[var(--color-txt-0)]">{time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
