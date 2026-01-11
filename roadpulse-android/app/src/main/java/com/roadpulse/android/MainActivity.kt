package com.roadpulse.android

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.compose.runtime.rememberCoroutineScope
import com.roadpulse.android.service.SensorMonitorController
import com.roadpulse.android.service.ServiceState
import com.roadpulse.android.ui.theme.RoadPulseTheme
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    @Inject
    lateinit var sensorController: SensorMonitorController
    
    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.values.all { it }
        if (allGranted) {
            // Permissions granted, can start monitoring
        } else {
            // Handle permission denial
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Request necessary permissions
        requestPermissions()
        
        setContent {
            RoadPulseTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    SensorMonitoringScreen(sensorController)
                }
            }
        }
    }
    
    private fun requestPermissions() {
        val permissions = arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.FOREGROUND_SERVICE,
            Manifest.permission.FOREGROUND_SERVICE_LOCATION
        )
        
        val permissionsToRequest = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        
        if (permissionsToRequest.isNotEmpty()) {
            permissionLauncher.launch(permissionsToRequest.toTypedArray())
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SensorMonitoringScreen(controller: SensorMonitorController) {
    val serviceState by controller.serviceState.collectAsState()
    val serviceStats by controller.serviceStats.collectAsState()
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    
    // Update stats periodically
    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(1000) // Update every second
        // In a real app, you might want to use a more sophisticated update mechanism
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Title
        Text(
            text = "RoadPulse Sensor Monitoring",
            style = MaterialTheme.typography.headlineMedium
        )
        
        // Service Status Card
        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Service Status",
                    style = MaterialTheme.typography.titleMedium
                )
                
                Text("State: ${serviceState.name}")
                Text("Unsynced Events: ${serviceStats.unsyncedEventCount}")
                Text("Current Session: ${serviceStats.currentSessionId?.take(8) ?: "None"}")
                Text("Active Session: ${if (serviceStats.hasActiveSession) "Yes" else "No"}")
                
                if (serviceStats.isDegradedMode) {
                    Text(
                        text = "⚠️ Running in Degraded Mode",
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
        
        // Control Buttons
        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Controls",
                    style = MaterialTheme.typography.titleMedium
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = { controller.startMonitoring() },
                        enabled = serviceState == ServiceState.STOPPED,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Start")
                    }
                    
                    Button(
                        onClick = { controller.stopMonitoring() },
                        enabled = serviceState in listOf(ServiceState.RUNNING, ServiceState.PAUSED),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Stop")
                    }
                }
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = { controller.pauseMonitoring() },
                        enabled = serviceState == ServiceState.RUNNING,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Pause")
                    }
                    
                    Button(
                        onClick = { controller.resumeMonitoring() },
                        enabled = serviceState == ServiceState.PAUSED,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Resume")
                    }
                }
            }
        }
        
        // Configuration Card
        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Configuration",
                    style = MaterialTheme.typography.titleMedium
                )
                
                val config = controller.getCurrentConfig()
                
                Text("Acceleration Threshold: ${config.accelerationThreshold} m/s²")
                Text("Normal Sampling Rate: ${config.normalSamplingRateHz} Hz")
                Text("Reduced Sampling Rate: ${config.reducedSamplingRateHz} Hz")
                Text("Battery Pause: ${config.batteryPauseThreshold}%")
                Text("Battery Resume: ${config.batteryResumeThreshold}%")
                Text("GPS Accuracy Threshold: ${config.gpsAccuracyThresholdM} m")
                Text("Min Speed: ${config.minSpeedKmh} km/h")
                
                Button(
                    onClick = { 
                        coroutineScope.launch {
                            controller.resetConfigToDefaults()
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Reset to Defaults")
                }
            }
        }
        
        // Maintenance Card
        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Maintenance",
                    style = MaterialTheme.typography.titleMedium
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = { 
                            coroutineScope.launch {
                                controller.cleanupOldEvents()
                            }
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cleanup")
                    }
                    
                    Button(
                        onClick = { 
                            coroutineScope.launch {
                                controller.deleteAllEvents()
                            }
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.error
                        ),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Delete All")
                    }
                }
            }
        }
    }
}