// ecopoints-scanner.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
  Easing,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { usePoints } from '../../contexts/PointsContext';

const VOUCHERS = [
  { id: 1, title: "Starbucks Coffee", description: "Free Grande Coffee", points: 50, icon: "☕", color: "#00704A" },
  { id: 2, title: "McDonald's Meal", description: "$5 Off Any Meal", points: 75, icon: "🍔", color: "#FFC72C" },
  { id: 3, title: "Grab Ride", description: "$3 Ride Discount", points: 30, icon: "🚗", color: "#00B14F" },
  { id: 4, title: "Shopee Voucher", description: "$10 Shopping Credit", points: 100, icon: "🛒", color: "#EE4D2D" },
  { id: 5, title: "Cinema Ticket", description: "Free Movie Ticket", points: 120, icon: "🎬", color: "#8B5CF6" }
];

const { width } = Dimensions.get("window");
const scanBoxSize = width * 0.6;

const BACKEND_BASE = 'http://192.168.0.132:3000';

export default function EcoPointsScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const { points, addPoints, deductPoints } = usePoints();
  const [showCamera, setShowCamera] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newPoints, setNewPoints] = useState(0);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showVoucherSuccess, setShowVoucherSuccess] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: scanBoxSize - 4,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    
    try {
      // Handle kiosk QR format: "POINTS:25|CODE:QR_123456789"
      if (data.includes('POINTS:') && data.includes('CODE:')) {
        const parts = data.split('|');
        const pointsEarned = parseInt(parts[0].split(':')[1]) || 0;
        const qrCode = parts[1].split(':')[1];

        // Validate and claim QR code from backend
        const res = await fetch(`${BACKEND_BASE}/qr/claim`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            code: qrCode,
            deviceId: 'mobile_' + Math.random().toString(36).substr(2, 9)
          }),
        });

        const result = await res.json();

        if (!result.success) {
          Alert.alert("QR Code Issue", result.error || "This QR code has already been used or is invalid.");
          setShowCamera(false);
          setScanned(false);
          return;
        }

        const earnedPoints = result.points || 0;
        setNewPoints(earnedPoints);
        addPoints(earnedPoints);
        setShowSuccess(true);

        setTimeout(() => {
          setShowCamera(false);
          setScanned(false);
        }, 3000);
        return;
      }
      
      // Fallback for other formats
      Alert.alert("Invalid QR Code", "This QR code format is not supported.");
      setShowCamera(false);
      setScanned(false);

    } catch (error) {
      console.error('QR Parse Error:', error);
      Alert.alert("Invalid QR Code", "Unable to process this QR code.");
      setShowCamera(false);
      setScanned(false);
    }
  };

  const openCamera = () => {
    setScanned(false);
    setShowCamera(true);
  };

  const closeCamera = () => {
    setShowCamera(false);
    setScanned(false);
  };

  const closeSuccessModal = () => {
    setShowSuccess(false);
  };

  const selectVoucher = (voucher: any) => {
    if (points < voucher.points) {
      Alert.alert("Insufficient Points", `You need ${voucher.points} points but only have ${points} points.`);
      return;
    }
    setSelectedVoucher(voucher);
    setShowConfirm(true);
  };

  const confirmRedemption = () => {
    if (deductPoints(selectedVoucher.points)) {
      setShowConfirm(false);
      setShowVoucherSuccess(true);
      setTimeout(() => setShowVoucherSuccess(false), 3000);
    }
  };

  const cancelRedemption = () => {
    setSelectedVoucher(null);
    setShowConfirm(false);
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text>No access to camera. Please enable camera permissions.</Text>
        <TouchableOpacity onPress={requestPermission} style={{ marginTop: 20, padding: 10, backgroundColor: '#00D4AA', borderRadius: 10 }}>
          <Text style={{ color: 'white' }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#0F0F23', '#1A1A2E', '#16213E']} style={styles.container}>
      <LinearGradient colors={['#00D4AA', '#00A8CC']} style={styles.header}>
        <View style={styles.logo}>
          <MaterialIcons name="recycling" size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.headerTitle}>EcoPoints Scanner</Text>
        <Text style={styles.headerSubtitle}>
          Scan your recycling QR codes to earn rewards
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>YOUR ECO POINTS</Text>
          <Text style={styles.pointsValue}>{points}</Text>
          <Text style={styles.pointsSubtext}>
            Scan a QR code from the kiosk to add more points
          </Text>
        </LinearGradient>

        <View style={styles.scanSection}>
          <Text style={styles.sectionTitle}>Scan Kiosk QR Code</Text>
          <Text style={styles.sectionText}>
            After sorting waste at the kiosk, scan the QR code to collect your points
          </Text>
          <LinearGradient colors={['#00D4AA', '#00A8CC']} style={styles.scanButton}>
            <TouchableOpacity style={styles.scanButtonInner} onPress={openCamera}>
              <Ionicons name="qr-code" size={24} color="white" />
              <Text style={styles.scanButtonText}>Scan QR Code</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={styles.voucherSection}>
          <Text style={styles.sectionTitle}>Redeem Vouchers</Text>
          {VOUCHERS.map(voucher => (
            <TouchableOpacity 
              key={voucher.id} 
              style={styles.voucherCard}
              onPress={() => selectVoucher(voucher)}
            >
              <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={styles.voucherGradient}>
                <View style={styles.voucherContent}>
                  <View style={[styles.voucherIconContainer, { backgroundColor: voucher.color }]}>
                    <Text style={styles.voucherIcon}>{voucher.icon}</Text>
                  </View>
                  <View style={styles.voucherInfo}>
                    <Text style={styles.voucherTitle}>{voucher.title}</Text>
                    <Text style={styles.voucherDescription}>{voucher.description}</Text>
                  </View>
                  <View style={styles.voucherPoints}>
                    <Text style={styles.pointsRequired}>{voucher.points}</Text>
                    <Text style={styles.pointsText}>points</Text>
                  </View>
                </View>
                {points < voucher.points && (
                  <View style={styles.insufficientOverlay}>
                    <Text style={styles.insufficientText}>Insufficient Points</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView 
            style={styles.camera} 
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} 
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }} 
          />

          <View style={styles.overlay}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            <Animated.View
              style={[styles.scanLine, { transform: [{ translateY: scanAnim }] }]}
            />
          </View>

          <TouchableOpacity style={styles.closeCamera} onPress={closeCamera}>
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          <Text style={styles.instructions}>
            Point your camera at the QR code from the kiosk
          </Text>
        </View>
      </Modal>

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']} style={styles.customAlert}>
            <MaterialIcons name="stars" size={60} color="#00D4AA" />
            <Text style={styles.alertTitle}>Points Added!</Text>
            <Text style={styles.alertMessage}>
              You've successfully collected {newPoints} points.
            </Text>
            <LinearGradient colors={['#00D4AA', '#00A8CC']} style={styles.alertButton}>
              <TouchableOpacity style={styles.alertButtonInner} onPress={closeSuccessModal}>
                <Text style={styles.alertButtonText}>Continue</Text>
              </TouchableOpacity>
            </LinearGradient>
          </LinearGradient>
        </View>
      </Modal>

      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']} style={styles.customAlert}>
            <Text style={styles.alertTitle}>Confirm Redemption</Text>
            <Text style={styles.confirmIcon}>{selectedVoucher?.icon}</Text>
            <Text style={styles.confirmVoucher}>{selectedVoucher?.title}</Text>
            <Text style={styles.confirmDescription}>{selectedVoucher?.description}</Text>
            <Text style={styles.confirmPoints}>Cost: {selectedVoucher?.points} points</Text>
            <Text style={styles.remainingPoints}>
              Remaining: {points - (selectedVoucher?.points || 0)} points
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelRedemption}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <LinearGradient colors={['#00D4AA', '#00A8CC']} style={styles.redeemButton}>
                <TouchableOpacity style={styles.redeemButtonInner} onPress={confirmRedemption}>
                  <Text style={styles.redeemButtonText}>Redeem</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      <Modal visible={showVoucherSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']} style={styles.customAlert}>
            <MaterialIcons name="check-circle" size={60} color="#00D4AA" />
            <Text style={styles.alertTitle}>Voucher Redeemed!</Text>
            <Text style={styles.alertMessage}>
              Your {selectedVoucher?.title} voucher has been added to your account.
            </Text>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingTop: 60, paddingBottom: 25, paddingHorizontal: 25, alignItems: "center" },
  logo: { width: 80, height: 80, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 15, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "white", marginBottom: 5 },
  headerSubtitle: { fontSize: 16, color: "white", opacity: 0.9, textAlign: "center" },
  content: { flex: 1, padding: 20, paddingBottom: 40 },
  pointsCard: { borderRadius: 20, padding: 25, alignItems: "center", marginBottom: 25, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  pointsLabel: { color: "white", fontSize: 18, marginBottom: 10, fontWeight: "600" },
  pointsValue: { color: "white", fontSize: 48, fontWeight: "800", marginVertical: 10 },
  pointsSubtext: { color: "white", fontSize: 14, opacity: 0.9 },
  scanSection: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20, padding: 25, alignItems: "center", marginBottom: 30, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  sectionTitle: { color: "#00D4AA", fontSize: 22, fontWeight: "700", marginBottom: 15 },
  sectionText: { color: "rgba(255,255,255,0.8)", marginBottom: 20, textAlign: "center", lineHeight: 20 },
  scanButton: { borderRadius: 50, width: "100%", shadowColor: "#00D4AA", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  scanButtonInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 20 },
  scanButtonText: { color: "white", fontSize: 20, fontWeight: "700", marginLeft: 12 },
  cameraContainer: { flex: 1, backgroundColor: "black", justifyContent: "center", alignItems: "center" },
  camera: { width: "100%", height: "100%" },
  overlay: { position: "absolute", top: "25%", left: "50%", marginLeft: -scanBoxSize / 2, width: scanBoxSize, height: scanBoxSize, zIndex: 10, marginTop: 105 },
  corner: { position: "absolute", width: 25, height: 25, borderColor: "#FFD700", borderWidth: 3 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: { height: 2, width: scanBoxSize, backgroundColor: "#FFD700", position: "absolute", top: 0 },
  closeCamera: { position: "absolute", top: 50, right: 20, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 20, padding: 10, zIndex: 20 },
  instructions: { position: "absolute", bottom: 50, color: "white", fontSize: 16, textAlign: "center", paddingHorizontal: 20, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 10, padding: 15 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center", padding: 20 },
  customAlert: { borderRadius: 25, padding: 30, width: "90%", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  alertTitle: { fontSize: 26, fontWeight: "800", color: "#00D4AA", marginBottom: 15 },
  alertMessage: { fontSize: 16, textAlign: "center", marginBottom: 25, color: "#333" },
  alertButton: { borderRadius: 50, width: "100%", shadowColor: "#00D4AA", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10 },
  alertButtonInner: { paddingVertical: 15, paddingHorizontal: 40 },
  alertButtonText: { color: "white", fontSize: 18, fontWeight: "700", textAlign: "center" },
  voucherSection: { marginBottom: 50 },
  voucherCard: { borderRadius: 15, marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  voucherGradient: { borderRadius: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  voucherContent: { flexDirection: "row", alignItems: "center", padding: 18 },
  voucherIconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", marginRight: 15 },
  voucherIcon: { fontSize: 24 },
  voucherInfo: { flex: 1 },
  voucherTitle: { fontSize: 16, fontWeight: "700", color: "white" },
  voucherDescription: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  voucherPoints: { alignItems: "center" },
  pointsRequired: { fontSize: 18, fontWeight: "800", color: "#00D4AA" },
  pointsText: { fontSize: 10, color: "rgba(255,255,255,0.6)" },
  insufficientOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", borderRadius: 15, justifyContent: "center", alignItems: "center" },
  insufficientText: { color: "white", fontWeight: "700", fontSize: 12 },
  confirmIcon: { fontSize: 50, marginBottom: 15 },
  confirmVoucher: { fontSize: 20, fontWeight: "700", color: "#333", marginBottom: 5 },
  confirmDescription: { fontSize: 14, color: "#666", marginBottom: 15, textAlign: "center" },
  confirmPoints: { fontSize: 18, fontWeight: "700", color: "#FF6B6B", marginBottom: 5 },
  remainingPoints: { fontSize: 14, color: "#666", marginBottom: 25 },
  confirmButtons: { flexDirection: "row", width: "100%" },
  cancelButton: { flex: 1, backgroundColor: "rgba(0,0,0,0.1)", padding: 15, borderRadius: 12, marginRight: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.2)" },
  redeemButton: { flex: 1, borderRadius: 12, marginLeft: 10 },
  redeemButtonInner: { padding: 15 },
  cancelButtonText: { textAlign: "center", fontSize: 16, fontWeight: "700", color: "#666" },
  redeemButtonText: { textAlign: "center", fontSize: 16, fontWeight: "700", color: "white" },
});
