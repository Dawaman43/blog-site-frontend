import type { FC } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Unsubscribed: FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4"
    >
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Unsubscribed Successfully
        </h1>
        <p className="text-muted-foreground mb-6">
          You've been removed from our newsletter. We're sorry to see you go!
        </p>
        <Link to="/">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Back to Home
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

export default Unsubscribed;
