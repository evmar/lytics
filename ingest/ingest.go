package main

import (
	"bufio"
	"fmt"
	"io"
	"log"
	"os"
	"path"
	"regexp"
	"strconv"
	"time"
)

type LogLine struct {
	Hostname string
	Time     time.Time
	Method   string
	Path     string
	Status   int
	Size     int
	Referer  string
	UA       string
}

var reLine = regexp.MustCompile(`^(\S+) - - \[(.*?) \+0000\] "(\S+) (.*?) HTTP/1.1" (\S+) (\S+) "(.*?)" "(.*?)"`)

func (l *LogLine) parse(text string) error {
	m := reLine.FindStringSubmatch(text)
	if m == nil {
		return fmt.Errorf("failed to match")
	}
	var timeStr string
	var status string
	var size string
	l.Hostname, timeStr, l.Method, l.Path, status, size, l.Referer, l.UA = m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8]

	var err error
	l.Time, err = time.Parse("02/Jan/2006:15:04:05", timeStr)
	if err != nil {
		return err
	}

	n, err := strconv.ParseInt(status, 10, 32)
	if err != nil {
		return err
	}
	l.Status = int(n)

	if size == "-" {
		l.Size = -1
	} else {
		n, err := strconv.ParseInt(size, 10, 32)
		if err != nil {
			return err
		}
		l.Size = int(n)
	}

	return nil
}

type Table interface {
	Flush() error
	Close() error
}

type Loader struct {
	dateWriter *NumTabWriter
	pathWriter *StrTabWriter
}

func newLoader(dir string) (*Loader, error) {
	var l Loader

	t, err := NewTableWriter(path.Join(dir, "date"))
	if err != nil {
		return nil, err
	}
	l.dateWriter = NewNumTabWriter(t)

	t, err = NewTableWriter(path.Join(dir, "path"))
	if err != nil {
		return nil, err
	}
	l.pathWriter = NewStrTabWriter(t)

	return &l, nil
}

func (l *Loader) parse(r io.Reader) error {
	lines := 0
	s := bufio.NewScanner(r)
	var logLine LogLine
	for s.Scan() {
		lines++
		line := s.Text()
		if err := logLine.parse(line); err != nil {
			return fmt.Errorf("line %d: %s in %q", lines, err, line)
		}
		if err := l.dateWriter.Write(int(logLine.Time.Unix())); err != nil {
			return err
		}
		if err := l.pathWriter.Write(logLine.Path); err != nil {
			return err
		}
	}
	if err := s.Err(); err != nil {
		return err
	}
	log.Printf("read %d lines", lines)

	type Table interface {
		Finish() error
		Flush() error
		Close() error
	}

	for _, w := range []Table{l.dateWriter, l.pathWriter} {
		if err := w.Finish(); err != nil {
			return err
		}
		if err := w.Flush(); err != nil {
			return err
		}
		if err := w.Close(); err != nil {
			return err
		}
	}
	return nil
}

func run() error {
	l, err := newLoader("../tab")
	if err != nil {
		return err
	}

	return l.parse(os.Stdin)
}

func main() {
	if err := run(); err != nil {
		fmt.Printf("ERROR: %s\n", err)
	}
}
