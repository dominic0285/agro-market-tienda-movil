import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, Image, TouchableOpacity, FlatList, 
  TextInput, ScrollView, Alert, StatusBar, Linking, Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker'; 


const IMAGENES_DEFAULT = {
  alimento: { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4VTh4asQgMGqU5LchnFvlj8oUHawFxEsimQ&s' }, 
  machete: { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRzlpiv5Y3Lw66NbMfhk1w0MzurBrBoCy7-w&s' },
  fertilizante: { uri: 'https://www.consumer.es/app/uploads/2019/07/img_fertilizante.jpg' },
  default: { uri: 'https://placehold.co/400x400/png?text=Sin+Foto' } 
};

// Número de WhatsApp del negocio (formato internacional, sin +). Cámbialo por el tuyo.
const NUMERO_WHATSAPP = '580000000000';
const COLORES = {
  primary: '#2E7D32', secondary: '#81C784', bg: '#F1F8E9', 
  card: '#FFFFFF', text: '#1B5E20', accent: '#FF8F00', input: '#E8F5E9'
};



const VistaCatalogo = ({ productos, alComprar }) => (
  <FlatList
    data={productos}
    keyExtractor={item => item.id}
    contentContainerStyle={{padding: 15, paddingBottom: 100}}
    renderItem={({ item }) => {
      
      let fuenteImagen;
      if (item.fotoSubida) {
        fuenteImagen = { uri: item.fotoSubida };
      } else {
        fuenteImagen = IMAGENES_DEFAULT[item.imgKey] || IMAGENES_DEFAULT['default'];
      }

      return (
        <View style={styles.card}>
          <Image source={fuenteImagen} style={styles.cardImage} resizeMode="cover" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.titulo}</Text>
            <Text style={styles.cardDesc}>{item.desc}</Text>
            <Text style={styles.cardPrice}>${item.precio}</Text>
            <TouchableOpacity style={styles.btnComprar} onPress={() => alComprar(item)}>
              <Text style={styles.btnText}>+ Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }}
  />
);

const VistaVendedor = ({ nuevoProducto, setNuevoProducto, alPublicar }) => {
  
  const elegirFoto = async () => {
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos entrar a tu galería para subir la foto.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setNuevoProducto({ ...nuevoProducto, fotoSubida: result.assets[0].uri });
    }
  };

  return (
    <ScrollView style={{padding: 20}}>
      <Text style={styles.headerTitle}>Publicar Insumo</Text>
      <View style={styles.formCard}>
        
        {/* CAJA PARA SUBIR FOTO */}
        <Text style={styles.label}>1. Foto del Producto:</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={elegirFoto}>
          {nuevoProducto.fotoSubida ? (
            <Image source={{ uri: nuevoProducto.fotoSubida }} style={styles.uploadedImage} />
          ) : (
            <View style={{alignItems: 'center'}}>
              <Text style={{fontSize: 30}}>📷</Text>
              <Text style={{color: '#666'}}>Toca para subir foto</Text>
            </View>
          )}
        </TouchableOpacity>
        
        {nuevoProducto.fotoSubida && (
          <Text style={{textAlign:'center', color: COLORES.primary, fontSize: 12, marginBottom: 10, fontWeight: 'bold'}}>
            ✅ ¡Foto cargada!
          </Text>
        )}

        <Text style={styles.label}>2. Datos del Producto:</Text>
        <TextInput 
          style={styles.input} 
          value={nuevoProducto.titulo} 
          onChangeText={t => setNuevoProducto({...nuevoProducto, titulo: t})} 
          placeholder="Ej: Semillas de Maíz"
        />
        
        <TextInput 
          style={styles.input} 
          value={nuevoProducto.desc} 
          onChangeText={t => setNuevoProducto({...nuevoProducto, desc: t})} 
          placeholder="Descripción..."
        />
        
        <TextInput 
          style={styles.input} 
          keyboardType="numeric" 
          value={nuevoProducto.precio} 
          onChangeText={t => setNuevoProducto({...nuevoProducto, precio: t})} 
          placeholder="Precio ($)"
        />
        
        <TouchableOpacity style={[styles.btnComprar, {marginTop: 20, backgroundColor: COLORES.primary}]} onPress={alPublicar}>
          <Text style={styles.btnText}>PUBLICAR AHORA</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const VistaCarrito = ({ carrito, alEliminar, total, irAPagar }) => (
  <View style={{flex: 1, padding: 20}}>
    <Text style={styles.headerTitle}>Tu Carrito 🛒</Text>
    {carrito.length === 0 ? <Text style={{textAlign:'center', marginTop: 20, color:'#888'}}>Vacío</Text> : null}
    <FlatList
      data={carrito}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item, index }) => (
        <View style={styles.cartItem}>
          <View>
            <Text style={{fontWeight: 'bold', color: COLORES.text}}>{item.titulo}</Text>
            <Text style={{color: '#666'}}>${item.precio}</Text>
          </View>
          <TouchableOpacity onPress={() => alEliminar(index)}>
            <Text style={{color: 'red', fontWeight: 'bold', fontSize: 18}}>X</Text>
          </TouchableOpacity>
        </View>
      )}
    />
    <View style={styles.totalContainer}>
      <Text style={styles.totalText}>Total: ${total}</Text>
      {carrito.length > 0 && (
        <TouchableOpacity style={styles.btnCheckout} onPress={irAPagar}>
          <Text style={styles.btnText}>PAGAR</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const VistaCheckout = ({ 
  total, // <--- TOTAL RECIBIDO
  metodoPago, setMetodoPago, referencia, setReferencia, 
  fechaPago, setFechaPago, showDatePicker, setShowDatePicker, 
  alEnviar, alVolver 
}) => (
  <ScrollView style={{padding: 20}}>
    <Text style={styles.headerTitle}>Finalizar Compra</Text>
    
    {/* --- MONTO GIGANTE --- */}
    <View style={styles.amountDisplay}>
      <Text style={{color: '#EEE', fontSize: 14}}>MONTO A TRANSFERIR:</Text>
      <Text style={{color: '#FFF', fontSize: 36, fontWeight: 'bold'}}>${total}</Text>
    </View>

    <View style={styles.infoBox}>
      <Text style={styles.infoTitle}>DATOS PAGO ({metodoPago.toUpperCase()}):</Text>
      <Text style={styles.infoText}>
        {metodoPago === 'pagomovil' ? '0414-1234567 • CI: 12.345.678' : 
         metodoPago === 'zelle' ? 'agro@store.com' : 'Cuenta: 0134-0000...'}
      </Text>
    </View>

    <View style={{flexDirection: 'row', marginBottom: 20, justifyContent: 'center'}}>
      {['pagomovil', 'zelle', 'transferencia'].map(m => (
        <TouchableOpacity 
          key={m} 
          style={[styles.chip, metodoPago === m && styles.chipActive]} 
          onPress={() => setMetodoPago(m)}
        >
          <Text style={[styles.chipText, metodoPago === m && {color: '#FFF'}]}>{m.toUpperCase()}</Text>
        </TouchableOpacity>
      ))}
    </View>

    <Text style={styles.label}>Número de Referencia</Text>
    <TextInput 
      style={styles.input} 
      keyboardType="numeric" 
      value={referencia} 
      onChangeText={setReferencia} 
      placeholder="Últimos 4 dígitos"
    />

    <Text style={styles.label}>Fecha del Pago</Text>
    <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
      <Text style={{fontWeight: 'bold', color: COLORES.text}}>{fechaPago.toLocaleDateString()}</Text>
    </TouchableOpacity>
    
    {showDatePicker && (
      <DateTimePicker 
        value={fechaPago} 
        mode="date" 
        display="default" 
        onChange={(e, d) => { setShowDatePicker(false); if(d) setFechaPago(d); }} 
      />
    )}

    <TouchableOpacity style={styles.btnWhatsapp} onPress={alEnviar}>
      <Text style={[styles.btnText, {fontSize: 18}]}>ENVIAR WHATSAPP</Text>
    </TouchableOpacity>

    <TouchableOpacity style={{marginTop: 20, alignItems: 'center'}} onPress={alVolver}>
      <Text style={{color: '#666', textDecorationLine: 'underline'}}>Volver al carrito</Text>
    </TouchableOpacity>
    <View style={{height: 50}}/>
  </ScrollView>
);



export default function App() {
  const [vistaActual, setVistaActual] = useState('catalogo');
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  
  // Checkout
  const [metodoPago, setMetodoPago] = useState('pagomovil');
  const [referencia, setReferencia] = useState('');
  const [fechaPago, setFechaPago] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  
  const [nuevoProducto, setNuevoProducto] = useState({ 
    titulo: '', precio: '', desc: '', imgKey: 'alimento', fotoSubida: null 
  });

  useEffect(() => { cargarInventario(); }, []);

  const cargarInventario = async () => {
    // Usamos otra key para reiniciar datos y evitar conflictos
    const inventarioGuardado = await AsyncStorage.getItem('@agro_v7_fusion');
    if (inventarioGuardado) {
      setProductos(JSON.parse(inventarioGuardado));
    } else {
      const datosIniciales = [
        { id: '1', titulo: 'Saco Alimento 20kg', precio: 25, desc: 'Engorde premium', imgKey: 'alimento' },
        { id: '2', titulo: 'Machete Gavilán', precio: 12, desc: 'Acero templado 22"', imgKey: 'machete' },
        { id: '3', titulo: 'Fertilizante Triple 15', precio: 45, desc: 'Saco 50kg Importado', imgKey: 'fertilizante' },
      ];
      setProductos(datosIniciales);
      guardarInventario(datosIniciales);
    }
  };

  const guardarInventario = async (data) => {
    await AsyncStorage.setItem('@agro_v7_fusion', JSON.stringify(data));
  };

  const agregarAlCarrito = (producto) => {
    setCarrito([...carrito, producto]);
    Alert.alert("¡Listo!", "Agregado al carrito");
  };

  const eliminarDelCarrito = (index) => {
    const copia = [...carrito];
    copia.splice(index, 1);
    setCarrito(copia);
  };

  const publicarProducto = () => {
    if (!nuevoProducto.titulo || !nuevoProducto.precio) {
      Alert.alert("Error", "Falta nombre o precio");
      return;
    }
    const prod = {
      id: Date.now().toString(),
      titulo: nuevoProducto.titulo,
      precio: parseFloat(nuevoProducto.precio),
      desc: nuevoProducto.desc,
      imgKey: 'default', 
      fotoSubida: nuevoProducto.fotoSubida 
    };
    const nuevo = [prod, ...productos];
    setProductos(nuevo);
    guardarInventario(nuevo);
    // Reiniciar formulario
    setNuevoProducto({ titulo: '', precio: '', desc: '', imgKey: 'alimento', fotoSubida: null });
    Alert.alert("Éxito", "Producto Publicado");
    setVistaActual('catalogo');
  };

  const calcularTotal = () => carrito.reduce((s, i) => s + i.precio, 0);

  const enviarPedidoWhatsApp = () => {
    if (!referencia) { Alert.alert("Falta Referencia", "Escribe el número de pago."); return; }
    const total = calcularTotal();
    const items = carrito.map(i => `- ${i.titulo} ($${i.precio})`).join('\n');
    const msg = `*PEDIDO AGRO* 🚜\n----------------\n${items}\n----------------\n*TOTAL: $${total}*\nMetodo: ${metodoPago}\nRef: ${referencia}\nFecha: ${fechaPago.toLocaleDateString()}`;
    Linking.openURL(`whatsapp://send?phone=${NUMERO_WHATSAPP}&text=${encodeURIComponent(msg)}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORES.primary} barStyle="light-content" />
      
      <View style={styles.content}>
        {vistaActual === 'catalogo' && <VistaCatalogo productos={productos} alComprar={agregarAlCarrito} />}
        
        {vistaActual === 'vendedor' && (
          <VistaVendedor 
            nuevoProducto={nuevoProducto} 
            setNuevoProducto={setNuevoProducto} 
            alPublicar={publicarProducto} 
          />
        )}
        
        {vistaActual === 'carrito' && (
          <VistaCarrito 
            carrito={carrito} 
            alEliminar={eliminarDelCarrito} 
            total={calcularTotal()} 
            irAPagar={() => setVistaActual('checkout')} 
          />
        )}
        
        {vistaActual === 'checkout' && (
          <VistaCheckout 
            total={calcularTotal()} 
            metodoPago={metodoPago} setMetodoPago={setMetodoPago}
            referencia={referencia} setReferencia={setReferencia}
            fechaPago={fechaPago} setFechaPago={setFechaPago}
            showDatePicker={showDatePicker} setShowDatePicker={setShowDatePicker}
            alEnviar={enviarPedidoWhatsApp}
            alVolver={() => setVistaActual('carrito')}
          />
        )}
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={() => setVistaActual('catalogo')}>
          <Text style={[styles.menuText, vistaActual === 'catalogo' && styles.menuActive]}>🏠 Tienda</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => setVistaActual('vendedor')}>
          <Text style={[styles.menuText, vistaActual === 'vendedor' && styles.menuActive]}>📢 Vender</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => setVistaActual('carrito')}>
          <Text style={[styles.menuText, (vistaActual === 'carrito' || vistaActual === 'checkout') && styles.menuActive]}>
            🛒 Carrito ({carrito.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORES.bg },
  content: { flex: 1, marginTop: 30 }, 
  menu: { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 12, borderTopWidth: 1, borderColor: '#DDD', elevation: 8 },
  menuItem: { flex: 1, alignItems: 'center', paddingVertical: 5 },
  menuText: { color: '#999', fontWeight: 'bold', fontSize: 12 },
  menuActive: { color: COLORES.primary, fontSize: 14, fontWeight: 'bold' },
  
  card: { flexDirection: 'row', backgroundColor: COLORES.card, marginVertical: 6, marginHorizontal: 15, borderRadius: 12, overflow: 'hidden', elevation: 3 },
  cardImage: { width: 110, height: 110 },
  cardContent: { flex: 1, padding: 12, justifyContent: 'center' },
  cardTitle: { fontWeight: 'bold', fontSize: 16, color: COLORES.text },
  cardDesc: { color: '#666', fontSize: 12, marginBottom: 5 },
  cardPrice: { fontSize: 18, color: COLORES.accent, fontWeight: 'bold' },
  btnComprar: { backgroundColor: COLORES.accent, padding: 8, borderRadius: 6, alignItems: 'center', marginTop: 5, alignSelf: 'flex-start' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORES.text, marginBottom: 15, textAlign: 'center' },
  formCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, elevation: 2 },
  label: { fontWeight: 'bold', color: COLORES.text, marginTop: 12, marginBottom: 5 },
  input: { backgroundColor: COLORES.input, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#C8E6C9', fontSize: 16 },
  
  // CAJA PARA SUBIR FOTO
  uploadBox: { height: 150, backgroundColor: '#E8F5E9', borderRadius: 10, borderWidth: 2, borderColor: '#C8E6C9', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  uploadedImage: { width: '100%', height: '100%', borderRadius: 8 },

  cartItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#FFF', marginBottom: 8, borderRadius: 8, elevation: 1 },
  totalContainer: { marginTop: 20, padding: 20, backgroundColor: '#FFF', borderRadius: 12, alignItems: 'center', elevation: 2 },
  totalText: { fontSize: 22, fontWeight: 'bold', color: COLORES.text, marginBottom: 15 },
  btnCheckout: { backgroundColor: COLORES.primary, paddingVertical: 12, paddingHorizontal: 40, borderRadius: 8 },
  
  // MONTO GIGANTE
  amountDisplay: { backgroundColor: COLORES.primary, padding: 20, borderRadius: 10, alignItems: 'center', marginBottom: 20, elevation: 4 },

  infoBox: { backgroundColor: '#E8F5E9', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#A5D6A7', marginBottom: 20 },
  infoTitle: { fontWeight: 'bold', color: '#1B5E20', marginBottom: 5 },
  infoText: { color: '#333' },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderWidth: 1, borderColor: COLORES.primary, borderRadius: 20, marginHorizontal: 4 },
  chipActive: { backgroundColor: COLORES.primary },
  chipText: { color: COLORES.primary, fontSize: 12, fontWeight: 'bold' },
  dateBtn: { padding: 15, backgroundColor: '#FFF', borderRadius: 8, marginTop: 5, alignItems: 'center', borderWidth: 1, borderColor: '#DDD' },
  btnWhatsapp: { backgroundColor: '#25D366', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 30, elevation: 4 }
});