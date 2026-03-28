import { useState } from 'react'
import Icon from '../components/Icons'

const diningLocations = [
  {
    id: 'tower',
    name: 'Tower Dining',
    status: 'open',
    hours: 'Closes 2:00 PM',
    meal: 'Lunch',
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
    entrees: ['Burgers', 'Wings', 'Loaded Fries', 'Quesadillas'],
    sides: ['Mozzarella Sticks', 'Nachos'],
    desserts: ['Milkshakes', 'Churros'],
  },
]

export default function Dining() {
  const [selectedLocation, setSelectedLocation] = useState(diningLocations[0])

  return (
    <div className="max-w-[900px] mx-auto px-8 py-6 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-medium text-[var(--color-txt-0)]">Campus Dining</h1>
          <p className="text-[13px] text-[var(--color-txt-1)] mt-1">
            See what's being served today
          </p>
        </div>
        <div className="text-xs text-[var(--color-txt-1)] bg-[var(--color-bg-0)] border border-[var(--color-border-2)] rounded-lg px-3.5 py-1.5 flex items-center gap-1.5">
          <Icon name="clock" size={13} className="text-[var(--color-txt-2)]" />
          Lunch service
        </div>
      </div>

      {/* Location Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {diningLocations.map(loc => (
          <button
            key={loc.id}
            onClick={() => setSelectedLocation(loc)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border whitespace-nowrap transition-all
              ${selectedLocation.id === loc.id 
                ? 'bg-[var(--color-bg-0)] border-[var(--color-border-2)]' 
                : 'bg-transparent border-transparent hover:bg-[var(--color-bg-0)]'
              }`}
          >
            <div className={`w-2 h-2 rounded-full ${loc.status === 'open' ? 'bg-green-500' : 'bg-red-400'}`} />
            <span className="text-[13px] font-medium text-[var(--color-txt-0)]">{loc.name}</span>
          </button>
        ))}
      </div>

      {/* Selected Location Details */}
      <div className="bg-[var(--color-bg-0)] border border-[var(--color-border)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium text-[var(--color-txt-0)]">{selectedLocation.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${selectedLocation.status === 'open' ? 'bg-green-500 animate-pulse-dot' : 'bg-red-400'}`} />
              <span className="text-xs text-[var(--color-txt-1)]">
                {selectedLocation.status === 'open' ? 'Open now' : 'Closed'} · {selectedLocation.meal} · {selectedLocation.hours}
              </span>
            </div>
          </div>
          <button className="bg-gold-dark text-gold rounded-lg px-4 py-2 text-xs flex items-center gap-1.5">
            <Icon name="mapPin" size={12} />
            Get directions
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Entrees */}
          <div>
            <div className="text-[10px] font-semibold text-[var(--color-txt-2)] uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Icon name="dining" size={12} />
              Entrées
            </div>
            <div className="flex flex-col gap-1.5">
              {selectedLocation.entrees.map(item => (
                <div 
                  key={item}
                  className="text-xs bg-[var(--color-stat)] rounded-lg px-3 py-2 text-[var(--color-txt-0)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Sides */}
          <div>
            <div className="text-[10px] font-semibold text-[var(--color-txt-2)] uppercase tracking-wide mb-2">
              Sides & Salads
            </div>
            <div className="flex flex-col gap-1.5">
              {selectedLocation.sides.map(item => (
                <div 
                  key={item}
                  className="text-xs bg-[var(--color-stat)] rounded-lg px-3 py-2 text-[var(--color-txt-0)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Desserts */}
          <div>
            <div className="text-[10px] font-semibold text-[var(--color-txt-2)] uppercase tracking-wide mb-2">
              Desserts
            </div>
            <div className="flex flex-col gap-1.5">
              {selectedLocation.desserts.map(item => (
                <div 
                  key={item}
                  className="text-xs bg-[var(--color-stat)] rounded-lg px-3 py-2 text-[var(--color-txt-0)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hours */}
        <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
          <div className="text-[10px] font-semibold text-[var(--color-txt-2)] uppercase tracking-wide mb-2">
            Hours
          </div>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="bg-[var(--color-stat)] rounded-lg p-3">
              <div className="text-[var(--color-txt-2)] mb-1">Breakfast</div>
              <div className="text-[var(--color-txt-0)] font-medium">7:00 – 10:30 AM</div>
            </div>
            <div className="bg-[var(--color-stat)] rounded-lg p-3">
              <div className="text-[var(--color-txt-2)] mb-1">Lunch</div>
              <div className="text-[var(--color-txt-0)] font-medium">11:00 AM – 2:00 PM</div>
            </div>
            <div className="bg-[var(--color-stat)] rounded-lg p-3">
              <div className="text-[var(--color-txt-2)] mb-1">Dinner</div>
              <div className="text-[var(--color-txt-0)] font-medium">4:30 – 8:00 PM</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
