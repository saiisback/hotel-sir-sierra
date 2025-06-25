"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Menu, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Check, 
  Clock, 
  User, 
  Phone, 
  ShoppingBag, 
  DollarSign,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Flame,
  Leaf,
  Award,
  Star,
  RefreshCw
} from "lucide-react"
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Database operations for manager
const managerDbOperations = {
  // Menu Items Operations
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

  createMenuItem: async (item) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert([item])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating menu item:', error)
      throw error
    }
  },

  updateMenuItem: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating menu item:', error)
      throw error
    }
  },

  deleteMenuItem: async (id) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting menu item:', error)
      throw error
    }
  },

  // Orders Operations
  getOrders: async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users (
            full_name,
            mobile
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching orders:', error)
      throw error
    }
  },

  updateOrderStatus: async (id, status) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating order status:', error)
      throw error
    }
  }
}

const categories = ["Starters", "Mains", "Rice & Biryani", "Breads", "Desserts", "Beverages"]
const orderStatuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"]

export default function SriSierraManager() {
  const [currentView, setCurrentView] = useState("login")
  const [managerCredentials, setManagerCredentials] = useState({ username: "", password: "" })
  
  // Menu Management State
  const [menuItems, setMenuItems] = useState([])
  const [editingItem, setEditingItem] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [menuSearch, setMenuSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  
  // Orders Management State
  const [orders, setOrders] = useState([])
  const [orderSearch, setOrderSearch] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [selectedOrder, setSelectedOrder] = useState(null)
  
  // UI State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    category: "Starters",
    image_url: "",
    is_bestseller: false,
    is_vegetarian: false,
    is_spicy: false
  })

  useEffect(() => {
    if (currentView === "menu") {
      loadMenuItems()
    } else if (currentView === "orders") {
      loadOrders()
    }
  }, [currentView])

  const loadMenuItems = async () => {
    try {
      setLoading(true)
      const items = await managerDbOperations.getMenuItems()
      setMenuItems(items)
    } catch (err) {
      setError("Failed to load menu items")
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      setLoading(true)
      const orderData = await managerDbOperations.getOrders()
      setOrders(orderData)
    } catch (err) {
      setError("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    // Simple authentication - in production, use proper authentication
    if (managerCredentials.username === "admin" && managerCredentials.password === "admin123") {
      setCurrentView("menu")
      setError("")
    } else {
      setError("Invalid credentials")
    }
  }

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.description || !newItem.price) {
      setError("Please fill in all required fields")
      return
    }

    try {
      setLoading(true)
      await managerDbOperations.createMenuItem({
        ...newItem,
        price: parseFloat(newItem.price)
      })
      setSuccess("Menu item added successfully")
      setShowAddForm(false)
      setNewItem({
        name: "",
        description: "",
        price: "",
        category: "Starters",
        image_url: "",
        is_bestseller: false,
        is_vegetarian: false,
        is_spicy: false
      })
      loadMenuItems()
    } catch (err) {
      setError("Failed to add menu item")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateItem = async (id, updates) => {
    try {
      setLoading(true)
      await managerDbOperations.updateMenuItem(id, updates)
      setSuccess("Menu item updated successfully")
      setEditingItem(null)
      loadMenuItems()
    } catch (err) {
      setError("Failed to update menu item")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      setLoading(true)
      await managerDbOperations.deleteMenuItem(id)
      setSuccess("Menu item deleted successfully")
      loadMenuItems()
    } catch (err) {
      setError("Failed to delete menu item")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      setLoading(true)
      await managerDbOperations.updateOrderStatus(orderId, status)
      setSuccess(`Order ${status} successfully`)
      loadOrders()
    } catch (err) {
      setError("Failed to update order status")
    } finally {
      setLoading(false)
    }
  }

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
                         item.description.toLowerCase().includes(menuSearch.toLowerCase())
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.users?.full_name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
                         order.users?.mobile?.includes(orderSearch) ||
                         order.id.includes(orderSearch)
    const matchesStatus = selectedStatus === "All" || order.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "text-yellow-600 bg-yellow-100"
      case "confirmed": return "text-blue-600 bg-blue-100"
      case "preparing": return "text-orange-600 bg-orange-100"
      case "ready": return "text-green-600 bg-green-100"
      case "completed": return "text-gray-600 bg-gray-100"
      case "cancelled": return "text-red-600 bg-red-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  const clearMessages = () => {
    setError("")
    setSuccess("")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence mode="wait">
        {currentView === "login" && (
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
              className="w-full max-w-md"
            >
              <div className="bg-white rounded-3xl shadow-2xl p-8">
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Menu className="w-10 h-10 text-white" />
                  </motion.div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">Sri Sierra</h1>
                  <p className="text-gray-600">Manager Dashboard</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <input
                    type="text"
                    value={managerCredentials.username}
                    onChange={(e) => setManagerCredentials({ ...managerCredentials, username: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Username"
                  />
                  <input
                    type="password"
                    value={managerCredentials.password}
                    onChange={(e) => setManagerCredentials({ ...managerCredentials, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Password"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogin}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-xl shadow-lg"
                  >
                    Login to Dashboard
                  </motion.button>
                </div>

                <div className="mt-6 text-center text-sm text-gray-500">
                  Demo credentials: admin / admin123
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {(currentView === "menu" || currentView === "orders") && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
          >
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
              <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">Sri Sierra Manager</h1>
                    <p className="text-gray-600">Restaurant Management Dashboard</p>
                  </div>
                  <button
                    onClick={() => setCurrentView("login")}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-white border-b border-gray-200">
              <div className="px-4">
                <div className="flex space-x-8">
                  <button
                    onClick={() => setCurrentView("menu")}
                    className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      currentView === "menu"
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Menu Management
                  </button>
                  <button
                    onClick={() => setCurrentView("orders")}
                    className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      currentView === "orders"
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Orders Management
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            {(error || success) && (
              <div className="px-4 py-2">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2 flex items-center justify-between">
                    <p className="text-red-600 text-sm">{error}</p>
                    <button onClick={clearMessages} className="text-red-400 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2 flex items-center justify-between">
                    <p className="text-green-600 text-sm">{success}</p>
                    <button onClick={clearMessages} className="text-green-400 hover:text-green-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Menu Management */}
            {currentView === "menu" && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Menu Items</h2>
                  <div className="flex gap-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={loadMenuItems}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAddForm(true)}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item
                    </motion.button>
                  </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={menuSearch}
                        onChange={(e) => setMenuSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Search menu items..."
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="All">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Menu Items Grid */}
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredMenuItems.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                      >
                        {editingItem?.id === item.id ? (
                          <EditItemForm
                            item={editingItem}
                            onChange={setEditingItem}
                            onSave={(updates) => handleUpdateItem(item.id, updates)}
                            onCancel={() => setEditingItem(null)}
                            loading={loading}
                          />
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                              <img
                                src={item.image_url || "/placeholder.svg?height=64&width=64"}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = "/placeholder.svg?height=64&width=64"
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                                    <div className="flex items-center gap-1">
                                      {item.is_bestseller && <Award className="w-4 h-4 text-orange-500" />}
                                      {item.is_vegetarian && <Leaf className="w-4 h-4 text-green-500" />}
                                      {item.is_spicy && <Flame className="w-4 h-4 text-red-500" />}
                                    </div>
                                  </div>
                                  <p className="text-gray-600 text-sm mb-1">{item.description}</p>
                                  <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="px-2 py-1 bg-gray-100 rounded">{item.category}</span>
                                    <span className="font-semibold text-orange-600">£{item.price}</span>
                                    <div className="flex items-center gap-1">
                                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                      <span>{item.rating}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setEditingItem(item)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </motion.button>
                                  <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Orders Management */}
            {currentView === "orders" && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Orders</h2>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={loadOrders}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </motion.button>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Search by customer name, mobile, or order ID..."
                      />
                    </div>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="All">All Statuses</option>
                      {orderStatuses.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Orders List */}
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        layout
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-800">Order #{order.id.slice(-8)}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>{order.users?.full_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{order.users?.mobile}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>Pickup: {order.pickup_time}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-orange-600">£{order.total_amount}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            {selectedOrder?.id === order.id ? "Hide Details" : "View Details"}
                          </motion.button>
                          
                          <div className="flex gap-2">
                            {order.status === "pending" && (
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleUpdateOrderStatus(order.id, "confirmed")}
                                className="px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Accept
                              </motion.button>
                            )}
                            {order.status === "confirmed" && (
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleUpdateOrderStatus(order.id, "preparing")}
                                className="px-3 py-1 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1"
                              >
                                <Clock className="w-4 h-4" />
                                Preparing
                              </motion.button>
                            )}
                            {order.status === "preparing" && (
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleUpdateOrderStatus(order.id, "ready")}
                                className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                              >
                                <Check className="w-4 h-4" />
                                Ready
                              </motion.button>
                            )}
                            {order.status === "ready" && (
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleUpdateOrderStatus(order.id, "completed")}
                                className="px-3 py-1 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Complete
                              </motion.button>
                            )}
                            {(order.status === "pending" || order.status === "confirmed") && (
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleUpdateOrderStatus(order.id, "cancelled")}
                                className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                              >
                                <XCircle className="w-4 h-4" />
                                Cancel
                              </motion.button>
                            )}
                          </div>
                        </div>

                        {/* Order Details */}
                        <AnimatePresence>
                          {selectedOrder?.id === order.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-4 pt-4 border-t border-gray-200"
                            >
                              <h4 className="font-medium text-gray-800 mb-3">Order Items:</h4>
                              <div className="space-y-2 mb-4">
                                {order.items.map((item, index) => (
                                  <div key={index} className="flex justify-between text-sm">
                                    <span>{item.name} × {item.quantity}</span>
                                    <span>£{(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                              {order.kitchen_note && (
                                <div className="mb-3">
                                  <h5 className="font-medium text-gray-700 mb-1">Special Instructions:</h5>
                                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{order.kitchen_note}</p>
                                </div>
                              )}
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">UPI Transaction ID:</span> {order.upi_transaction_id}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowAddForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 overflow-y-auto"
            >
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-800">Add Menu Item</h3>
                      <button
                        onClick={() => setShowAddForm(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    
                    <AddItemForm
                      item={newItem}
                      onChange={setNewItem}
                      onSave={handleAddItem}
                      onCancel={() => setShowAddForm(false)}
                      loading={loading}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Add Item Form Component
function AddItemForm({ item, onChange, onSave, onCancel, loading }) {
  return (
    <div className="space-y-4">
      <input
        type="text"
        value={item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        placeholder="Item Name"
      />
      
      <textarea
        value={item.description}
        onChange={(e) => onChange({ ...item, description: e.target.value })}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent h-20 resize-none"
        placeholder="Description"
      />
      
      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          step="0.01"
          value={item.price}
          onChange={(e) => onChange({ ...item, price: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Price"
        />
        
        <select
          value={item.category}
          onChange={(e) => onChange({ ...item, category: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      
      <input
        type="url"
        value={item.image_url}
        onChange={(e) => onChange({ ...item, image_url: e.target.value })}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        placeholder="Image URL (optional)"
      />
      
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={item.is_bestseller}
            onChange={(e) => onChange({ ...item, is_bestseller: e.target.checked })}
            className="text-orange-500 focus:ring-orange-500"
          />
          Bestseller
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={item.is_vegetarian}
            onChange={(e) => onChange({ ...item, is_vegetarian: e.target.checked })}
            className="text-green-500 focus:ring-green-500"
          />
          Vegetarian
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={item.is_spicy}
            onChange={(e) => onChange({ ...item, is_spicy: e.target.checked })}
            className="text-red-500 focus:ring-red-500"
          />
          Spicy
        </label>
      </div>
      
      <div className="flex gap-3 pt-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onSave}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save
        </motion.button>
      </div>
    </div>
  )
}

// Edit Item Form Component
function EditItemForm({ item, onChange, onSave, onCancel, loading }) {
  return (
    <div className="space-y-4">
      <input
        type="text"
        value={item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        placeholder="Item Name"
      />
      
      <textarea
        value={item.description}
        onChange={(e) => onChange({ ...item, description: e.target.value })}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent h-20 resize-none"
        placeholder="Description"
      />
      
      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          step="0.01"
          value={item.price}
          onChange={(e) => onChange({ ...item, price: parseFloat(e.target.value) || 0 })}
          className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Price"
        />
        
        <select
          value={item.category}
          onChange={(e) => onChange({ ...item, category: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      
      <input
        type="url"
        value={item.image_url || ""}
        onChange={(e) => onChange({ ...item, image_url: e.target.value })}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        placeholder="Image URL (optional)"
      />
      
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={item.is_bestseller}
            onChange={(e) => onChange({ ...item, is_bestseller: e.target.checked })}
            className="text-orange-500 focus:ring-orange-500"
          />
          Bestseller
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={item.is_vegetarian}
            onChange={(e) => onChange({ ...item, is_vegetarian: e.target.checked })}
            className="text-green-500 focus:ring-green-500"
          />
          Vegetarian
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={item.is_spicy}
            onChange={(e) => onChange({ ...item, is_spicy: e.target.checked })}
            className="text-red-500 focus:ring-red-500"
          />
          Spicy
        </label>
      </div>
      
      <div className="flex gap-3 pt-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onSave({
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            image_url: item.image_url || null,
            is_bestseller: item.is_bestseller,
            is_vegetarian: item.is_vegetarian,
            is_spicy: item.is_spicy
          })}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save
        </motion.button>
      </div>
    </div>
  )
}