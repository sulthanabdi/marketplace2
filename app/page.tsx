import Link from 'next/link';
import SellItemButton from '@/app/components/SellItemButton';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-manrope bg-gray-50">
      {/* Header - Tempat untuk menambahkan header jika diperlukan */}
      
      {/* Bagian Hero - Bagian utama halaman */}
      <main className="flex-grow">
        {/* Section Hero dengan padding dan margin yang responsif */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center">
            {/* Judul utama dengan styling responsif */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Buy and Sell Used Items <br /> on <span className="text-primary">Campus</span>
            </h1>
            {/* Deskripsi dengan styling responsif */}
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Connect with fellow students to sell items safely and easily. Save money and reduce waste!
            </p>
            {/* Container untuk tombol-tombol dengan flexbox responsif */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {/* Tombol Browse Products */}
              <Link
                href="/products"
                className="bg-primary text-white px-6 py-3 md:px-8 md:py-4 rounded-lg text-lg font-medium hover:bg-primary/90 transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Browse Products
              </Link>
              {/* Komponen tombol jual barang */}
              <SellItemButton />
            </div>
          </div>
        </section>

        {/* Bagian Fitur - Menampilkan keunggulan platform */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header bagian fitur */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Why Choose Telkommerce?</h2>
              {/* Garis dekoratif di bawah judul */}
              <div className="w-20 h-1 bg-primary mx-auto mt-4"></div>
            </div>
            {/* Grid untuk menampilkan 3 fitur utama */}
            <div className="grid md:grid-cols-3 gap-8">
              {/* Array data fitur yang akan di-render */}
              {[
                {
                  // Icon untuk fitur Easy Trading
                  icon: (
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ),
                  title: "Easy Trading",
                  description: "Buy and sell items with fellow students in just a few clicks."
                },
                {
                  // Icon untuk fitur Trusted Community
                  icon: (
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  title: "Trusted Community",
                  description: "All users are verified campus members for safe transactions."
                },
                {
                  // Icon untuk fitur Sustainable
                  icon: (
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  ),
                  title: "Sustainable",
                  description: "Reduce waste by giving items a second life on campus."
                }
              ].map((feature, index) => (
                // Render setiap fitur dengan styling yang konsisten
                <div key={index} className="text-center p-6 rounded-xl hover:shadow-md transition duration-300 border border-gray-100">
                  {/* Container untuk icon dengan background berwarna */}
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    {feature.icon}
                  </div>
                  {/* Judul fitur */}
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  {/* Deskripsi fitur */}
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bagian About Us - Tentang platform */}
        <section id="about" className="py-16 bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header bagian About Us */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">About Telkommerce</h2>
              {/* Garis dekoratif */}
              <div className="w-20 h-1 bg-primary mx-auto mt-4"></div>
            </div>
            {/* Layout flexbox untuk konten dan gambar */}
            <div className="md:flex items-center gap-12">
              {/* Container untuk gambar */}
              <div className="md:w-1/2 mb-8 md:mb-0">
                <img 
                  src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" 
                  alt="Students on campus" 
                  className="rounded-lg shadow-lg w-full object-cover h-80 md:h-auto"
                />
              </div>
              {/* Container untuk teks konten */}
              <div className="md:w-1/2">
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                {/* Paragraf pertama tentang misi */}
                <p className="text-gray-600 mb-4">
                  Telkommerce was founded by students, for students. We noticed how much perfectly good stuff gets thrown away at the end of each semester, and we wanted to create a better way.
                </p>
                {/* Paragraf kedua tentang platform */}
                <p className="text-gray-600 mb-6">
                  Our platform connects buyers and sellers within your campus community, making it easy to find what you need and sell what you don't. It's sustainable, economical, and convenient.
                </p>
                {/* Container untuk tag-tag */}
                <div className="flex flex-wrap gap-2">
                  {/* Render tag-tag dengan styling */}
                  {['Sustainable', 'Student-Run', 'Campus-Focused'].map((tag, index) => (
                    <span key={index} className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Bagian bawah website */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Grid untuk 4 kolom footer */}
          <div className="grid md:grid-cols-4 gap-8">
            {/* Kolom pertama - Tentang Telkommerce */}
            <div>
              <h3 className="text-xl font-bold mb-4">Telkommerce</h3>
              <p className="text-gray-400">The easiest way to buy and sell used items on campus.</p>
            </div>
            {/* Kolom kedua - Quick Links */}
            <div>
              <h4 className="text-lg font-medium mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {/* Array link-link cepat */}
                {[
                  { href: "/", label: "Home" },
                  { href: "/products", label: "Products" },
                  { href: "#about", label: "About Us" },
                  { href: "#contact", label: "Contact" }
                ].map((link, index) => (
                  <li key={index}>
                    <Link href={link.href} className="text-gray-400 hover:text-white transition duration-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* Kolom ketiga - Help */}
            <div>
              <h4 className="text-lg font-medium mb-4">Help</h4>
              <ul className="space-y-2">
                {/* Array link-link bantuan */}
                {[
                  { href: "#", label: "FAQs" },
                  { href: "#", label: "Safety Tips" },
                  { href: "#", label: "Terms of Service" },
                  { href: "#", label: "Privacy Policy" }
                ].map((link, index) => (
                  <li key={index}>
                    <Link href={link.href} className="text-gray-400 hover:text-white transition duration-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* Kolom keempat - Contact Us */}
            <div>
              <h4 className="text-lg font-medium mb-4">Contact Us</h4>
              <p className="text-gray-400 mb-2">campus@trademail.com</p>
              <p className="text-gray-400 mb-4">+1 (555) 123-4567</p>
              {/* Container untuk social media icons */}
              <div className="flex space-x-4">
                {/* Array social media dengan icon */}
                {[
                  {
                    name: "Facebook",
                    icon: (
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                      </svg>
                    )
                  },
                  {
                    name: "Instagram",
                    icon: (
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                      </svg>
                    )
                  },
                  {
                    name: "Twitter",
                    icon: (
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                      </svg>
                    )
                  }
                ].map((social, index) => (
                  // Render setiap social media link
                  <Link 
                    key={index} 
                    href="#" 
                    className="text-gray-400 hover:text-white transition duration-200"
                    aria-label={social.name}
                  >
                    {social.icon}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {/* Copyright section di bagian bawah footer */}
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Telkommerce. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}