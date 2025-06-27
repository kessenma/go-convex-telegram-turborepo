"use client";

import { Button } from "@repo/ui/button";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

type Props = Omit<React.ComponentProps<typeof Image>, "src"> & {
  srcLight: string;
  srcDark: string;
};

const ThemeImage = (props: Props) => {
  const { srcLight, srcDark, ...rest } = props;

  return (
    <>
      <Image {...rest} src={srcLight} className="imgLight" />
      <Image {...rest} src={srcDark} className="imgDark" />
    </>
  );
};

export default function Home() {
  const messages = useQuery(api.telegram.getAllMessages, { limit: 5 });
  const messageCount = messages?.length || 0;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <ThemeImage
          className={styles.logo}
          srcLight="turborepo-dark.svg"
          srcDark="turborepo-light.svg"
          alt="Turborepo logo"
          width={180}
          height={38}
          priority
        />
        
        <div className={styles.hero}>
          <h1>Telegram Bot + Convex Dashboard</h1>
          <p>Monitor and view your Telegram bot messages in real-time</p>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <h3>Total Messages</h3>
            <p className={styles.statNumber}>
              {messages === undefined ? "Loading..." : messageCount}
            </p>
          </div>
          <div className={styles.statCard}>
            <h3>Database Status</h3>
            <p className={styles.statStatus}>
              {messages === undefined ? "Connecting..." : "Connected"}
            </p>
          </div>
        </div>

        <div className={styles.ctas}>
          <Link href="/messages" className={styles.primary}>
            <span>📱 View All Messages</span>
          </Link>
          <a
            className={styles.secondary}
            href="http://localhost:6791"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>🗄️ Convex Dashboard</span>
          </a>
          <a
            href="http://localhost:3211/api/health"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondary}
          >
            <span>🔍 API Health Check</span>
          </a>
        </div>
      </main>
    </div>
  );
}
