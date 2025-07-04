"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingCart, Plus, Minus, Check, ArrowLeft, Star, Clock, Flame, Leaf, Award, Phone, User, Search, Filter } from "lucide-react"
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Database operations using Supabase
const dbOperations = {
  // Get all menu items
  getMenuItems: async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category, name')
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching menu items:', error)
      throw error
    }
  },

  // Create or get user by mobile number
  createUser: async (userData) => {
    try {
      // First check if user exists by mobile
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('mobile', userData.mobile)
        .single()

      if (existingUser) {
        // Update existing user's name if different
        if (existingUser.full_name !== userData.fullName) {
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ full_name: userData.fullName })
            .eq('id', existingUser.id)
            .select()
            .single()
          
          if (updateError) throw updateError
          return updatedUser
        }
        return existingUser
      }

      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          full_name: userData.fullName,
          mobile: userData.mobile
        }])
        .select()
        .single()

      if (createError) throw createError
      return newUser
    } catch (error) {
      console.error('Error creating/updating user:', error)
      throw error
    }
  },

  // Create order
  createOrder: async (orderData) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          user_id: orderData.user_id,
          items: orderData.items,
          total_amount: orderData.total_amount,
          pickup_time: orderData.pickup_time,
          kitchen_note: orderData.kitchen_note || null,
          upi_transaction_id: orderData.upi_transaction_id,
          status: 'confirmed'
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating order:', error)
      throw error
    }
  }
}

const categories = ["Starters", "Mains", "Rice & Biryani", "Breads", "Desserts", "Beverages"]

export default function SriSierraOrdering() {
  const [currentStep, setCurrentStep] = useState("login")
  const [userData, setUserData] = useState({ fullName: "", mobile: "" })
  const [currentUser, setCurrentUser] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [activeCategory, setActiveCategory] = useState("Starters")
  const [cartItems, setCartItems] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [pickupTime, setPickupTime] = useState("")
  const [kitchenNote, setKitchenNote] = useState("")
  const [upiTransactionId, setUpiTransactionId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (currentStep === "menu") {
      loadMenuItems()
    }
  }, [currentStep])

  const loadMenuItems = async () => {
    try {
      setLoading(true)
      setError("")
      const items = await dbOperations.getMenuItems()
      setMenuItems(items)
      
      // Set first available category as active if current one has no items
      if (items.length > 0) {
        const availableCategories = [...new Set(items.map(item => item.category))]
        if (!availableCategories.includes(activeCategory)) {
          setActiveCategory(availableCategories[0])
        }
      }
    } catch (err) {
      setError("Failed to load menu items. Please try again.")
      console.error("Menu loading error:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = item.category === activeCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && (searchQuery ? matchesSearch : true)
  })

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = cartTotal * 0.05
  const finalTotal = cartTotal + tax

  const addToCart = (item) => {
    const existingItem = cartItems.find((cartItem) => cartItem.id === item.id)
    if (existingItem) {
      setCartItems(
        cartItems.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        ),
      )
    } else {
      setCartItems([...cartItems, { ...item, quantity: 1 }])
    }
  }

  const updateQuantity = (id, quantity) => {
    if (quantity === 0) {
      setCartItems(cartItems.filter((item) => item.id !== id))
    } else {
      setCartItems(cartItems.map((item) => (item.id === id ? { ...item, quantity } : item)))
    }
  }

  const handleLogin = async () => {
    if (!userData.fullName.trim() || !userData.mobile.trim()) {
      setError("Please fill in all fields")
      return
    }
    
    // Basic mobile number validation
    if (!/^\d{10,15}$/.test(userData.mobile.replace(/\s+/g, ''))) {
      setError("Please enter a valid mobile number")
      return
    }
    
    try {
      setLoading(true)
      setError("")
      const user = await dbOperations.createUser({
        fullName: userData.fullName.trim(),
        mobile: userData.mobile.replace(/\s+/g, '')
      })
      setCurrentUser(user)
      setCurrentStep("menu")
    } catch (err) {
      setError("Failed to create user profile. Please try again.")
      console.error("User creation error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmOrder = () => {
    if (!pickupTime) {
      setError("Please select a pickup time")
      return
    }
    
    // Validate pickup time is not in the past
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const selectedDateTime = new Date(`${today}T${pickupTime}`)
    
    if (selectedDateTime <= now) {
      setError("Please select a future pickup time")
      return
    }
    
    setError("")
    setCurrentStep("payment")
  }

  const handlePayment = async () => {
    if (!upiTransactionId.trim()) {
      setError("Please enter UPI transaction ID")
      return
    }

    if (!currentUser) {
      setError("User information not found. Please restart the process.")
      return
    }

    try {
      setLoading(true)
      setError("")
      
      const orderData = {
        user_id: currentUser.id,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total_amount: finalTotal,
        pickup_time: pickupTime,
        kitchen_note: kitchenNote.trim() || null,
        upi_transaction_id: upiTransactionId.trim()
      }
      
      await dbOperations.createOrder(orderData)
      setCurrentStep("success")
    } catch (err) {
      setError("Payment failed. Please verify your transaction ID and try again.")
      console.error("Order creation error:", err)
    } finally {
      setLoading(false)
    }
  }

  const getItemQuantity = (itemId) => {
    const item = cartItems.find((cartItem) => cartItem.id === itemId)
    return item ? item.quantity : 0
  }

  const resetApp = () => {
    setCurrentStep("login")
    setCartItems([])
    setCurrentUser(null)
    setUserData({ fullName: "", mobile: "" })
    setPickupTime("")
    setKitchenNote("")
    setUpiTransactionId("")
    setSearchQuery("")
    setError("")
    setActiveCategory("Starters")
  }

  // Get unique categories from loaded menu items
  const availableCategories = [...new Set(menuItems.map(item => item.category))].filter(cat => 
    categories.includes(cat)
  ).sort((a, b) => categories.indexOf(a) - categories.indexOf(b))

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence mode="wait">
        {currentStep === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-4"
            style={{
              background: "linear-gradient(135deg, #FF6B00 0%, #FFD700 100%)"
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              className="w-full max-w-sm"
            >
              <div className="bg-white rounded-3xl shadow-2xl p-8">
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <img 
                      src="/logo.jpeg" 
                      alt="Sri Sierra Logo" 
                      className="w-22 h-22 rounded-full"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/48/FFA500/FFFFFF?text=SS";
                      }} 
                    />
                  </motion.div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">Sri Sierra</h1>
                  <p className="text-gray-600">Pre-Ordering System</p>
                  <p className="text-gray-600">Made by Margros</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={userData.fullName}
                        onChange={(e) => setUserData({ ...userData, fullName: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Full Name"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        value={userData.mobile}
                        onChange={(e) => setUserData({ ...userData, mobile: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Mobile Number"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-xl shadow-lg disabled:opacity-50"
                  >
                    {loading ? "Please wait..." : "Continue"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {currentStep === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="min-h-screen bg-white"
          >
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h1 className="text-xl font-bold text-gray-800">Sri Sierra</h1>
                    <p className="text-sm text-gray-600">Hi {userData.fullName}!</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCartOpen(true)}
                    className="relative p-3 bg-orange-500 text-white rounded-full shadow-lg"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {cartItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    )}
                  </motion.button>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm"
                    placeholder="Search for dishes..."
                  />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="sticky top-24 z-40 bg-white border-b border-gray-100 px-4 py-3">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {availableCategories.map((category) => (
                  <motion.button
                    key={category}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveCategory(category)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeCategory === category
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {category}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-4 py-2">
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Menu Items */}
            <div className="px-4 py-4 pb-24">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {searchQuery ? "No dishes found matching your search." : "No items available in this category."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {item.is_bestseller && (
                                  <Award className="w-4 h-4 text-orange-500" />
                                )}
                                {item.is_vegetarian && (
                                  <Leaf className="w-4 h-4 text-green-500" />
                                )}
                                {item.is_spicy && (
                                  <Flame className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm text-gray-600">{item.rating}</span>
                              </div>
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-1">{item.name}</h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-orange-600">£{item.price}</span>
                              {getItemQuantity(item.id) === 0 ? (
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => addToCart(item)}
                                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium"
                                >
                                  Add
                                </motion.button>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => updateQuantity(item.id, getItemQuantity(item.id) - 1)}
                                    className="w-8 h-8 rounded-full border-2 border-orange-500 text-orange-500 flex items-center justify-center"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </motion.button>
                                  <span className="font-semibold text-lg min-w-[1rem] text-center">
                                    {getItemQuantity(item.id)}
                                  </span>
                                  <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => updateQuantity(item.id, getItemQuantity(item.id) + 1)}
                                    className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </motion.button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                            <img
                              src={item.image_url || "/placeholder.svg?height=96&width=96"}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = "/placeholder.svg?height=96&width=96"
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Floating Cart Button */}
            {cartItems.length > 0 && (
              <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="fixed bottom-4 left-4 right-4 z-50"
              >
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsCartOpen(true)}
                  className="w-full bg-orange-500 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold">
                        {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    </div>
                    <span className="font-medium">View Cart</span>
                  </div>
                  <span className="font-bold">£{finalTotal.toFixed(2)}</span>
                </motion.button>
              </motion.div>
            )}

            {/* Cart Drawer */}
            <AnimatePresence>
              {isCartOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-50"
                    onClick={() => setIsCartOpen(false)}
                  />
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[80vh] overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800">Your Order</h2>
                        <button
                          onClick={() => setIsCartOpen(false)}
                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                      {cartItems.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Your cart is empty</p>
                      ) : (
                        <div className="space-y-3">
                          {cartItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                              <img
                                src={item.image_url || "/placeholder.svg?height=48&width=48"}
                                alt={item.name}
                                className="w-12 h-12 rounded-lg object-cover"
                                onError={(e) => {
                                  e.target.src = "/placeholder.svg?height=48&width=48"
                                }}
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{item.name}</h4>
                                <p className="text-orange-600 font-semibold">£{item.price}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-semibold min-w-[1.5rem] text-center text-sm">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {cartItems.length > 0 && (
                      <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
                            <span>£{cartTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Tax (5%)</span>
                            <span>£{tax.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg text-orange-600 border-t pt-2">
                            <span>Total</span>
                            <span>£{finalTotal.toFixed(2)}</span>
                          </div>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setIsCartOpen(false)
                            setCurrentStep("confirm")
                          }}
                          className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl"
                        >
                          Proceed to Checkout
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {currentStep === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="min-h-screen bg-white"
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4">
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentStep("menu")}>
                  <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="text-xl font-bold text-gray-800">Order Details</h1>
              </div>
            </div>

            <div className="p-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-800">Pickup Time</h2>
                </div>
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Special Instructions</h2>
                <textarea
                  value={kitchenNote}
                  onChange={(e) => setKitchenNote(e.target.value)}
                  placeholder="Any special requests or dietary requirements..."
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent h-24 resize-none"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirmOrder}
                disabled={!pickupTime}
                className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl disabled:opacity-50"
              >
                Continue to Payment
              </motion.button>
            </div>
          </motion.div>
        )}

        {currentStep === "payment" && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="min-h-screen bg-white"
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4">
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentStep("confirm")}>
                  <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="text-xl font-bold text-gray-800">Payment</h1>
              </div>
            </div>

            <div className="p-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span>£{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>£{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (5%)</span>
                    <span>£{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg text-orange-600">
                    <span>Total</span>
                    <span>£{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Method</h2>
                <div className="text-center mb-6">
                  <div className="w-48 h-48 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <div className="text-6xl">📱</div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Scan QR code with your UPI app to pay £{finalTotal.toFixed(2)}
                  </p>
                </div>
                <input
                  type="text"
                  value={upiTransactionId}
                  onChange={(e) => setUpiTransactionId(e.target.value)}
                  placeholder="Enter UPI Transaction ID"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-4"
                  disabled={loading}
                />
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePayment}
                  disabled={!upiTransactionId || loading}
                  className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Confirm Payment"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="min-h-screen bg-white flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-12 h-12 text-green-600" />
              </motion.div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Order Confirmed!</h1>
              <p className="text-gray-600 mb-6">
                Your order has been placed successfully. You'll receive an SMS with pickup details shortly.
              </p>
              <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Pickup Time:</span>
                  <span className="text-sm font-medium">{pickupTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total:</span>
                  <span className="text-sm font-medium">£{finalTotal.toFixed(2)}</span>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={resetApp}
                className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl"
              >
                Return to Home
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}