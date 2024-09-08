"use client";

import Chat from "@/components/search/chat";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import OrSeparator from "@/components/ui/orSeparator";
import SideMenu from "@/components/ui/side-menu";
import MenuButton from "@/components/ui/menu-button"; // Import MenuButton

import { Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { SendHorizontal } from "lucide-react";
import React, { RefObject } from "react";
import { useEffect, useRef, useState } from "react";

export interface Table {
  data: Record<string, Record<string, any>>;
  headers: string[];
}

export interface Result {
  loading: boolean;
  table: Table;
  title: string;
  columns: string[];
  filters: {
    "Dimension List"?: string[];
    "Metric Mentioned": string[];
    "Specfic Dimension Value"?: string[];
  };
  selectedFilter?: {
    [key: string]: string;
  };
  userInput: string;
  suggestions?: string[];
  suggestedChat?: {
    query: string;
    result: Result;
  };
  chart?: {
    [key: string]: {
      data: {
        [date: string]: number;
      };
    };
  };
}

export default function Search() {
  const [chats, setChats] = useState<Result[]>([]);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const [isSideMenuVisible, setIsSideMenuVisible] = useState(true); // State for side menu visibility

  const { toast } = useToast();

  async function getSuggestions(index: number, sendIndex?: number) {
    try {
      const res = await fetch("http://localhost:4999/get_suggestion");
      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }
      const json = await res.json();

      setChats((prev) =>
        prev.map((item, i) =>
          i == index ? { ...item, suggestions: Object.values(json) } : item
        )
      );
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    }
  }
  async function getAiResult(query: string) {
    const uriQuery = encodeURIComponent(query);

    try {
      const res = await fetch("http://localhost:4999/search?query=" + uriQuery);
      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }
      const json = await res.json();

      if (json.chart && Object.keys(json.chart).length === 0) {
        json.chart = undefined;
      }
      return {
        ...json,
        userInput: query,
        loading: false,
      } as Result;
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    }
  }

  // Function to update charts
  async function updateChart(
    groupBy: string,
    breakdown: string,
    metric: string,
    index: number,
    ref: RefObject<HTMLDivElement>
  ) {
    const chartCopy = [...chats];
    chartCopy[index] = {
      ...chartCopy[index],
      loading: true,
      selectedFilter: {
        selectedGroupBy: groupBy,
        selectedBreakdown: breakdown,
        selectedMetric: metric,
      },
    };
    if (ref.current) {
      chatRef.current = ref.current;
    }
    setChats(chartCopy);

    try {
      const uriQuery = new URLSearchParams({
        groupby_col: groupBy,
        breakdown_col: breakdown,
        mertic: metric,
      });
      const res = await fetch(
        `http://localhost:4999/chart_gbm?${uriQuery.toString()}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }

      const json = (await res.json()) as {
        [key: string]: {
          data: {
            [date: string]: number;
          };
        };
      };
      chartCopy[index] = {
        ...chartCopy[index],
        chart: json,
      };
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      chartCopy[index] = {
        ...chartCopy[index],
        loading: false,
      };
      setChats([...chartCopy]);
    }
  }

  // Effect to handle chat scrolling
  useEffect(() => {
    if (chatRef.current) {
    } else if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chats]);

  // Function to add dynamic columns
  async function addDynamicColumn(
    Col: string,
    remove: boolean,
    index: number,
    ref: RefObject<HTMLDivElement>
  ) {
    const chartCopy = [...chats];
    chartCopy[index] = {
      ...chartCopy[index],
      loading: true,
    };

    if (ref.current) {
      chatRef.current = ref.current;
    }

    setChats(chartCopy);
    try {
      const uriQuery = new URLSearchParams({
        dynm_col: Col,
        if_delete: remove.toString(),
      });
      const res = await fetch(
        `http://localhost:4999/get_column?${uriQuery.toString()}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }

      const json = (await res.json())["table"] as Table;
      chartCopy[index] = {
        ...chartCopy[index],
        table: json,
      };
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      chartCopy[index] = {
        ...chartCopy[index],
        loading: false,
      };

      setChats([...chartCopy]);
    }
  }

  // Function to add a new chat
  async function addChat(chat: string) {
    chatRef.current = null;
    setChats([
      ...chats,
      {
        chart: {},
        columns: [],
        loading: true,
        table: {
          data: {},
          headers: [],
        },
        filters: {
          "Dimension List": [],
          "Metric Mentioned": [],
          "Specfic Dimension Value": [],
        },
        title: "",
        userInput: chat,
      },
    ]);

    const test = await getAiResult(chat);
    setChats((prev) => [...prev].slice(0, -1));
    if (test) {
      setChats([...chats, test]);
      getSuggestions(chats.length);
    }
  }

  async function onSuggestionClick(chatIndex: number, index: number) {}

  // Functions to toggle the side menu
  const handleOpen = () => {
    setIsSideMenuVisible(true);
  };
  const handleClose = () => {
    setIsSideMenuVisible(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Side Menu */}
      <SideMenu
        isVisible={isSideMenuVisible}
        onClose={handleClose}
        onOpen={handleOpen}
      />

      {/* Menu Button
      <MenuButton onClick={toggleSideMenu} /> */}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 relative items-center justify-center">
        {chats.length === 0 ? (
          <>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-500 via-blue-600 to-purple-500 bg-clip-text leading-tight text-transparent">
              Hello, Arijit!
            </h1>
            <p className="text-lg">How can I help you today?</p>
          </>
        ) : (
          <div
            ref={chatContainerRef}
            className="w-full flex-1 mb-16 flex flex-col p-4 space-y-3 overflow-y-auto"
          >
            {chats.map((chat, index) => (
              <Chat
                onColumnClick={addDynamicColumn}
                key={chat.userInput + index}
                chat={chat}
                index={index}
                onChartUpdate={updateChart}
              />
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="absolute bottom-0 w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const ele = (e.target as HTMLFormElement)[0] as HTMLInputElement;
              addChat(ele.value);
              ele.value = "";
            }}
            className="w-full p-2 flex items-center space-x-2"
          >
            <Input placeholder="Search" type="text" />
            <Button type="submit">
              <SendHorizontal size={16} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
