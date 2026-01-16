package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/mux"
)

// BandData represents a 3GPP band
type BandData struct {
	Band                string                 `json:"band"`
	Name                string                 `json:"name"`
	Mode                string                 `json:"mode"`
	DeltaFRasterKhz     int                    `json:"delta_f_raster_khz"`
	NRefStepSize        int                    `json:"n_ref_step_size"`
	DownlinkMhz         map[string]interface{} `json:"downlink_mhz"`
	BandwidthDlUlMhz    int                    `json:"bandwidth_dl_ul_mhz"`
	UplinkMhz           map[string]interface{} `json:"uplink_mhz"`
	DuplexSpacingMhz    int                    `json:"duplex_spacing_mhz"`
	GeographicalArea    string                 `json:"geographical_area"`
	Release3gpp         float64                `json:"release_3gpp"`
	ScsKhz              []int                  `json:"scs_khz"`
	SsbScsKhz           []int                  `json:"ssb_scs_khz"`
	SsbCaseCApplicable  bool                   `json:"ssb_case_c_applicable"`
	ScsWidthMapping     map[string][]int       `json:"scs_bandwidth_mapping"`
	ChannelBandwidthMhz []float64              `json:"channel_bandwidth_mhz"`
	Note                string                 `json:"note"`
}

// FormattedBandData represents the frontend-friendly band data structure
type FormattedBandData struct {
	Band                    string     `json:"band"`
	BandName                string     `json:"bandName"`
	Mode                    string     `json:"mode"`
	DlFreqRange             FreqRange  `json:"dlFreqRange"`
	UlFreqRange             FreqRange  `json:"ulFreqRange"`
	GeoArea                 string     `json:"geoArea"`
	Release                 string     `json:"release"`
	Scs                     []int      `json:"scs"`
	ScsBandwidthCombination []ScsGroup `json:"scsBandwidthCombination"`
	DuplexSpacingMhz        int        `json:"duplexSpacingMhz,omitempty"`
	BandwidthDlUlMhz        int        `json:"bandwidthDlUlMhz,omitempty"`
}

// FreqRange represents frequency range
type FreqRange struct {
	Low    float64 `json:"low"`
	Centre float64 `json:"centre"`
	High   float64 `json:"high"`
}

// ScsGroup represents SCS and associated bandwidths
type ScsGroup struct {
	Scs        int   `json:"scs"`
	Bandwidths []int `json:"bandwidths"`
}

var (
	nrBands  []BandData
	lteBands []BandData
)

// LoadBandData loads band data from JSON files
func LoadBandData() error {
	// Load NR bands
	nrData, err := os.ReadFile("data/3GPP-NR-FR1.json")
	if err != nil {
		log.Printf("Warning: Could not load NR band data: %v", err)
		nrBands = []BandData{}
	} else {
		if err := json.Unmarshal(nrData, &nrBands); err != nil {
			log.Printf("Warning: Could not parse NR band data: %v", err)
		}
	}

	// Load LTE bands
	lteData, err := os.ReadFile("data/3GPP-LTE-FR1.json")
	if err != nil {
		log.Printf("Warning: Could not load LTE band data: %v", err)
		lteBands = []BandData{}
	} else {
		if err := json.Unmarshal(lteData, &lteBands); err != nil {
			log.Printf("Warning: Could not parse LTE band data: %v", err)
		}
	}

	log.Printf("Loaded %d NR bands and %d LTE bands", len(nrBands), len(lteBands))
	return nil
}

// FormatBandData converts raw band data to frontend format
func FormatBandData(band BandData) FormattedBandData {
	formatted := FormattedBandData{
		Band:             band.Band,
		BandName:         band.Name,
		Mode:             band.Mode,
		GeoArea:          band.GeographicalArea,
		Release:          fmt.Sprintf("%.0f", band.Release3gpp),
		Scs:              band.ScsKhz,
		DuplexSpacingMhz: band.DuplexSpacingMhz,
		BandwidthDlUlMhz: band.BandwidthDlUlMhz,
	}

	// Extract frequency ranges from downlink
	if band.DownlinkMhz != nil {
		dl := band.DownlinkMhz
		dlFreq := FreqRange{}
		if v, ok := dl["low"].(float64); ok {
			dlFreq.Low = v
		}
		// Handle both "middle" (NR) and "center" (LTE) keys
		if v, ok := dl["middle"].(float64); ok {
			dlFreq.Centre = v
		} else if v, ok := dl["center"].(float64); ok {
			dlFreq.Centre = v
		}
		if v, ok := dl["high"].(float64); ok {
			dlFreq.High = v
		}
		formatted.DlFreqRange = dlFreq
	}

	// Extract frequency ranges from uplink
	if band.UplinkMhz != nil {
		ul := band.UplinkMhz
		ulFreq := FreqRange{}
		if v, ok := ul["low"].(float64); ok {
			ulFreq.Low = v
		}
		// Handle both "middle" (NR) and "center" (LTE) keys
		if v, ok := ul["middle"].(float64); ok {
			ulFreq.Centre = v
		} else if v, ok := ul["center"].(float64); ok {
			ulFreq.Centre = v
		}
		if v, ok := ul["high"].(float64); ok {
			ulFreq.High = v
		}
		formatted.UlFreqRange = ulFreq
	}

	// Build SCS bandwidth combinations
	scsSet := make(map[int]bool)
	for _, scs := range band.ScsKhz {
		scsSet[scs] = true
	}

	for scs := range scsSet {
		scsStr := fmt.Sprintf("%d", scs)
		if bws, ok := band.ScsWidthMapping[scsStr]; ok {
			formatted.ScsBandwidthCombination = append(formatted.ScsBandwidthCombination, ScsGroup{
				Scs:        scs,
				Bandwidths: bws,
			})
		}
	}

	// For LTE bands, use channel bandwidth instead
	if len(band.ScsWidthMapping) == 0 && len(band.ChannelBandwidthMhz) > 0 {
		// Convert float64 to int for bandwidths
		var intBandwidths []int
		for _, bw := range band.ChannelBandwidthMhz {
			intBandwidths = append(intBandwidths, int(bw*10)) // Convert to tenths of MHz (1.4 -> 14)
		}
		formatted.ScsBandwidthCombination = append(formatted.ScsBandwidthCombination, ScsGroup{
			Scs:        15, // Default SCS for LTE
			Bandwidths: intBandwidths,
		})
		formatted.Scs = []int{15}
	}

	return formatted
}

// HandleGetBands returns bands for a specific RAT (NR or LTE)
func HandleGetBands(w http.ResponseWriter, r *http.Request) {
	rat := mux.Vars(r)["rat"]

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	var bands []BandData
	switch strings.ToUpper(rat) {
	case "NR":
		bands = nrBands
	case "LTE":
		bands = lteBands
	default:
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid RAT. Use NR or LTE"})
		return
	}

	// Format bands for frontend
	var formattedBands []FormattedBandData
	for _, band := range bands {
		formattedBands = append(formattedBands, FormatBandData(band))
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(formattedBands)
}

// HandleGetBandDetails returns details for a specific band
func HandleGetBandDetails(w http.ResponseWriter, r *http.Request) {
	rat := mux.Vars(r)["rat"]
	bandName := mux.Vars(r)["band"]

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	var bands []BandData
	switch strings.ToUpper(rat) {
	case "NR":
		bands = nrBands
	case "LTE":
		bands = lteBands
	default:
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid RAT"})
		return
	}

	// Find the band
	for _, band := range bands {
		if strings.EqualFold(band.Band, bandName) {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(FormatBandData(band))
			return
		}
	}

	w.WriteHeader(http.StatusNotFound)
	json.NewEncoder(w).Encode(map[string]string{"error": "Band not found"})
}

func main() {
	// Load band data
	if err := LoadBandData(); err != nil {
		log.Fatalf("Failed to load band data: %v", err)
	}

	// Create router
	router := mux.NewRouter()

	// Routes
	router.HandleFunc("/api/bands/{rat}", HandleGetBands).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/bands/{rat}/{band}", HandleGetBandDetails).Methods("GET", "OPTIONS")
	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
	}).Methods("GET")

	// CORS middleware
	router.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	})

	// Start server
	port := ":8080"
	log.Printf("Starting Band Info API server on %s", port)
	if err := http.ListenAndServe(port, router); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
