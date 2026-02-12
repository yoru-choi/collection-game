package handler

import (
	"embed"
	"net/http"
)

//go:embed docs/*
var docsFS embed.FS

type DocsHandler struct{}

func NewDocsHandler() *DocsHandler {
	return &DocsHandler{}
}

func (h *DocsHandler) ServeOpenAPI(w http.ResponseWriter, r *http.Request) {
	data, err := docsFS.ReadFile("docs/openapi.json")
	if err != nil {
		http.Error(w, "openapi not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}

func (h *DocsHandler) ServeAsyncAPI(w http.ResponseWriter, r *http.Request) {
	data, err := docsFS.ReadFile("docs/asyncapi.yaml")
	if err != nil {
		http.Error(w, "asyncapi not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/yaml")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}

func (h *DocsHandler) ServeDocs(w http.ResponseWriter, r *http.Request) {
	data, err := docsFS.ReadFile("docs/docs.html")
	if err != nil {
		http.Error(w, "docs not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}

func (h *DocsHandler) ServeSwaggerUI(w http.ResponseWriter, r *http.Request) {
	data, err := docsFS.ReadFile("docs/swagger.html")
	if err != nil {
		http.Error(w, "swagger ui not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}
