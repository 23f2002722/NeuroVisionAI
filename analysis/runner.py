from analysis.analyze_segmentation import analyze_segmentation, save_analysis


def run_segmentation_analysis(prediction_path, output_path=None):
    analysis = analyze_segmentation(prediction_path)

    if output_path:
        save_analysis(analysis, output_path)

    return analysis