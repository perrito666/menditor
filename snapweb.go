package main

import (
	"fmt"
	"net"
	"net/http"
	"os"
	"sync"

	"gopkg.in/qml.v1"

	"github.com/hydrogen18/stoppableListener"
)

const webview = `
import QtQuick 2.0
import QtWebKit 3.0

WebView {
    width: 1600
    height: 800
}
`

const serveAtPort = 52660
const storagePath = "/tmp/shit"

func main() {
	stopServer := make(chan int)
	serverResult := make(chan error)
	go runAppServer(stopServer, serverResult)
	if err := qml.Run(run); err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
	}
	stopServer <- 0
	err := <-serverResult
	if err != nil && err != stoppableListener.StoppedError {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
	}

}

func dataHandler(w http.ResponseWriter, r *http.Request) {
	// TODO(perrito666) pass to appropriate handler for urls and respond in json
	// TODO(perrito666) See how to handle POST
	switch r.Method {
	case "GET":

	}
	fmt.Fprintf(w, "Some data")
	fmt.Print(r.URL.Path)
}

func handlePostNode() error {
	// TODO(perrito666) make node id folder, inside node label json and node text file
	// also add attachments somehow, most likely to the json and with resources folder.
	return nil
}

func runAppServer(serverStopChan chan int, serverResultChan chan error) {
	http.Handle("/app/", http.StripPrefix("/app/", http.FileServer(http.Dir("/home/hduran/Develop/menditor/resources"))))
	http.HandleFunc("/data/", dataHandler) // homepage

	originalListener, err := net.Listen("tcp", fmt.Sprintf(":%d", serveAtPort))
	if err != nil {
		panic(err)
	}

	sl, err := stoppableListener.New(originalListener)
	if err != nil {
		panic(err)
	}

	server := http.Server{}
	var wg sync.WaitGroup
	var serverError error
	go func() {
		wg.Add(1)
		defer wg.Done()
		serverError = server.Serve(sl)
	}()

	select {
	case <-serverStopChan:
		sl.Stop()
	}

	wg.Wait()
	serverResultChan <- serverError
}

func run() error {
	engine := qml.NewEngine()
	component, err := engine.LoadString("webview.qml", webview)
	if err != nil {
		return err
	}
	ctrl := &Control{
		done: make(chan error),
		win:  component.CreateWindow(nil),
	}
	engine.Context().SetVar("ctrl", ctrl)
	root := ctrl.win.Root()
	root.Set("url", fmt.Sprintf("http://localhost:%d/app/base.html", serveAtPort))
	ctrl.win.Show()
	ctrl.win.Wait()
	return nil
}

type Control struct {
	win  *qml.Window
	done chan error
}
