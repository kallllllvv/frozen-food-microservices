'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProductsPage() {
  // === STATE MANAGEMENT ===
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // State untuk Filter & Kategori
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [maxPrice, setMaxPrice] = useState(100000); // Default batas harga

  // Mengambil data dari backend
  useEffect(() => {
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProducts(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Gagal mengambil data", err);
        setLoading(false);
      });
  }, []);

  // === LOGIKA FILTERING ===
  const filteredProducts = products.filter(product => {
    const matchCategory = activeCategory === 'Semua' || product.category.toLowerCase() === activeCategory.toLowerCase();
    const matchPrice = product.price <= maxPrice;
    return matchCategory && matchPrice;
  });

  // Fungsi Proteksi Keranjang (Harus Login)
  const handleAddToCart = (productName) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert("Maaf, Anda harus masuk (login) terlebih dahulu untuk memesan!");
      router.push('/login');
    } else {
      alert(`✅ ${productName} berhasil dimasukkan ke keranjang!`);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      
      {/* HEADER SEDERHANA */}
      <header style={styles.header}>
        <div style={styles.headerContainer}>
          <Link href="/" style={styles.backButton}>
            ← Kembali ke Beranda
          </Link>
          <h2 style={{ margin: 0, color: '#333' }}>Semua Produk Frozen</h2>
          <div style={{ width: '120px' }}> {/* Spacer biar judul di tengah */}</div>
        </div>
      </header>

      {/* KONTEN UTAMA */}
      <main style={styles.mainContainer}>
        {/* BANNER KECIL */}
        <div style={styles.miniBanner}>
          <p style={{ margin: 0, fontSize: '16px' }}>🌟 <strong>Gratis Ongkir</strong> untuk pembelian di atas Rp 100.000!</p>
        </div>

        {/* --- FILTER BAR (Kategori & Harga) --- */}
        <div style={styles.filterSection}>
          <div style={styles.categoryRow}>
            {['Semua', 'Sosis', 'Naget', 'Daging Sapi', 'Kentang', 'Dimsum'].map((cat) => (
              <div 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                style={{
                  ...styles.categoryBadge, 
                  backgroundColor: activeCategory === cat ? '#00b894' : '#fff',
                  color: activeCategory === cat ? '#fff' : '#333',
                  borderColor: activeCategory === cat ? '#00b894' : '#eaeaea'
                }}
              >
                {cat}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>Filter Harga:</span>
            <select 
              style={styles.selectInput}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
            >
              <option value={100000}>Semua Harga</option>
              <option value={50000}>Di bawah Rp 50.000</option>
              <option value={30000}>Di bawah Rp 30.000</option>
            </select>
          </div>
        </div>

        {/* --- PRODUCT GRID --- */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
            <h3 style={{ animation: 'pulse 2s infinite' }}>Memuat katalog produk... ❄️</h3>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eaeaea' }}>
            Maaf, tidak ada produk yang sesuai dengan filter Anda.
          </div>
        ) : (
          <div style={styles.productGrid}>
            {filteredProducts.map((product) => (
              <div key={product.id} style={styles.productCard}>
                
                {/* BUNGKUS DENGAN LINK UNTUK KLIK DETAIL BARANG */}
                <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  {/* Bagian Gambar */}
                  <div style={styles.imageArea}>
                    {product.isPromo ? <div style={styles.promoBadge}>Promo</div> : null}
                    <span style={{ fontSize: '60px' }}>❄️</span>
                  </div>
                  
                  {/* Bagian Info Produk */}
                  <div style={styles.infoArea}>
                    <span style={styles.categoryTag}>{product.category}</span>
                    <h3 style={styles.productName}>{product.name}</h3>
                    
                    <div style={styles.priceRow}>
                      <span style={styles.priceText}>
                        Rp {product.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* TOMBOL KERANJANG DI LUAR LINK */}
                <div style={{ padding: '0 20px 20px 20px' }}>
                  <button 
                    style={styles.addToCartBtn}
                    onClick={(e) => {
                      e.preventDefault(); // Mencegah pindah halaman saat klik tombol keranjang
                      handleAddToCart(product.name);
                    }}
                  >
                    + Keranjang
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// === KUMPULAN STYLE ===
const styles = {
  pageWrapper: {
    backgroundColor: '#f4f7f6', 
    minHeight: '100vh',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#333',
    paddingBottom: '60px'
  },
  header: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #eaeaea',
    padding: '20px 0',
    position: 'sticky',
    top: 0,
    zIndex: 10
  },
  headerContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  backButton: {
    textDecoration: 'none',
    color: '#00b894',
    fontWeight: 'bold',
    fontSize: '15px'
  },
  mainContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  miniBanner: {
    backgroundColor: '#e6f8f5',
    color: '#00b894',
    padding: '15px 20px',
    borderRadius: '10px',
    marginBottom: '20px',
    border: '1px solid #bdf1e8',
    textAlign: 'center'
  },
  filterSection: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #eaeaea'
  },
  categoryRow: { 
    display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '5px' 
  },
  categoryBadge: { 
    padding: '8px 20px', borderRadius: '25px', border: '1px solid', fontSize: '14px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s', whiteSpace: 'nowrap' 
  },
  selectInput: { 
    padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', backgroundColor: '#f9f9f9', cursor: 'pointer', fontWeight: '500' 
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
    gap: '25px'
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid #eaeaea',
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  imageArea: {
    height: '180px',
    backgroundColor: '#f0f4f8',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  promoBadge: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    backgroundColor: '#ff7675',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  infoArea: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1
  },
  categoryTag: {
    backgroundColor: '#f0f4f8',
    color: '#666',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    alignSelf: 'flex-start',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  productName: {
    margin: '0 0 15px 0',
    fontSize: '18px',
    color: '#222',
    lineHeight: '1.4'
  },
  priceRow: {
    marginTop: 'auto',
    marginBottom: '0'
  },
  priceText: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#00b894'
  },
  addToCartBtn: {
    width: '100%',
    backgroundColor: '#00b894',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
};