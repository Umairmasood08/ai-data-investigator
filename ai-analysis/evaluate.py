import pandas as pd

def run_evaluation_metrics():
    try:
        # Load verification validation sheet keys
        try:
            ground_truth = pd.read_excel("GroundTruth.xlsx")
        except FileNotFoundError:
            ground_truth = pd.read_csv("ground_truth.csv")
            
        ground_truth.columns = ground_truth.columns.str.strip().str.lower().str.replace(" ", "_")
        ground_truth["canonical_cnic"] = ground_truth["canonical_cnic"].astype(str).str.strip()
        
        # Load predictions matrix out of your scoring script outputs
        predictions = pd.read_csv("scored_entities.csv")
        predictions["cnic"] = predictions["cnic"].astype(str).str.strip()
        
        # Build evaluation subset join logic
        pred_subset = predictions[["cnic", "flagged"]].drop_duplicates(subset=["cnic"])
        merged = ground_truth.merge(pred_subset, left_on="canonical_cnic", right_on="cnic", how="inner")
        
        if merged.empty:
            print("⚠️ Evaluation Warning: No inner-join intersection found between ground truth keys and computed records.")
            return

        y_true = merged["true_label"].astype(int)
        y_pred = merged["flagged"].astype(int)

        # Compute confusion matrix analytics
        TP = len(merged[(y_true == 1) & (y_pred == 1)])
        FP = len(merged[(y_true == 0) & (y_pred == 1)])
        FN = len(merged[(y_true == 1) & (y_pred == 0)])

        precision = TP / (TP + FP) if (TP + FP) > 0 else 0.0
        recall    = TP / (TP + FN) if (TP + FN) > 0 else 0.0
        f1_score  = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

        print("\n📊 SYSTEM METRICS PIPELINE RESULTS:")
        print(f"   True Positives (TP) : {TP}")
        print(f"   False Positives (FP): {FP}")
        print(f"   False Negatives (FN): {FN}")
        print("-" * 45)
        print(f"   Precision Score     : {precision:.4f} ({precision * 100:.2%})")
        print(f"   Recall Score        : {recall:.4f} ({recall * 100:.2%})")
        print(f"   F1-Score Tracking   : {f1_score:.4f} ({f1_score * 100:.2%})")

    except Exception as e:
        print(f"❌ Failure calculating system evaluation state: {str(e)}")

if __name__ == "__main__":
    run_evaluation_metrics()