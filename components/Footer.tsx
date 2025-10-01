import Link from 'next/link'
import { Shield, Award, Facebook, Instagram, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold font-medieval text-yellow-500 mb-4">NubArmory</h3>
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-5 w-5 text-yellow-500" />
              <span className="text-sm">Veteran Owned & Operated</span>
            </div>
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <span className="text-sm">Made to Order in USA</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="hover:text-yellow-500 transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/custom-order" className="hover:text-yellow-500 transition-colors">
                  Custom Orders
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-yellow-500 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-yellow-500 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/shipping" className="hover:text-yellow-500 transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-yellow-500 transition-colors">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-yellow-500 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-yellow-500 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Connect With Us</h4>
            <div className="flex space-x-4 mb-4">
              <a href="#" className="hover:text-yellow-500 transition-colors">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="hover:text-yellow-500 transition-colors">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="hover:text-yellow-500 transition-colors">
                <Twitter className="h-6 w-6" />
              </a>
            </div>
            <p className="text-sm">
              Subscribe to our newsletter for exclusive deals and new product releases!
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} NubArmory. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}