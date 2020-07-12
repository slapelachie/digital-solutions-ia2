using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;

namespace choujo
{
	/// <summary>
	/// Interaction logic for Window1.xaml
	/// </summary>
	public partial class Window1 : Window
	{
		public Window1()
		{
			InitializeComponent();
			// Fetch Data from backend and apply it to the TideData class
			TideData[] whyteTideDataThreshold = getTideData("http://192.168.1.238:1110/api/get?site=whyte_island&next_range");
			TideData[] whyteTideDataRange = getTideData("http://192.168.1.238:1110/api/get?site=whyte_island&max_range");
			TideData[] whyteCurrentTideData = getTideData("http://192.168.1.238:1110/api/get?site=whyte_island&current");
			int whyteAlertLevel = getAlertLevel("http://192.168.1.238:1110/api/get?site=whyte_island&alert_level").alert_level;
			Console.WriteLine(whyteAlertLevel);

			// Get the formatted dates for both the high and low tides
			string whyteNextHighTideDate = getFormattedDate(whyteTideDataThreshold[0].datetime);
			string whyteNextLowTideDate = getFormattedDate(whyteTideDataThreshold[1].datetime);
			string whyteMaxHighTideDate = getFormattedDate(whyteTideDataRange[0].datetime);
			string whyteMinLowTideDate = getFormattedDate(whyteTideDataRange[1].datetime);
			string whyteCurrentTideDate = getFormattedDate(whyteCurrentTideData[0].datetime);

			// Modify the text boxes to have the low and high tide data
			AlertBox.Text = whyteAlertLevel.ToString();
			NextHighTideBox.Text = whyteTideDataThreshold[0].water_level + "m at " + whyteNextHighTideDate;
			NextLowTideBox.Text = whyteTideDataThreshold[1].water_level + "m at " + whyteNextLowTideDate;
			HighTideBox.Text = whyteTideDataRange[0].water_level + "m at " + whyteMaxHighTideDate;
			LowTideBox.Text = whyteTideDataRange[1].water_level + "m at " + whyteMinLowTideDate;
			CurrentTideBox.Text = whyteCurrentTideData[0].water_level + "m as of " + whyteCurrentTideDate;

		}

		public TideData[] getTideData(string url)
		{
			// Create a web request to the specified url
			WebRequest request = WebRequest.Create(url);
			HttpWebResponse response = (HttpWebResponse)request.GetResponse();

			// Stream the data into a string
			Stream dataStream = response.GetResponseStream();
			StreamReader reader = new StreamReader(dataStream);
			string responseFromServer = reader.ReadToEnd();
			reader.Close();

			// Return the string in the form of the TideData class
			return JsonConvert.DeserializeObject<TideData[]>(responseFromServer);
		}
		public AlertLevel getAlertLevel(string url)
		{
			// Create a web request to the specified url
			WebRequest request = WebRequest.Create(url);
			HttpWebResponse response = (HttpWebResponse)request.GetResponse();

			// Stream the data into a string
			Stream dataStream = response.GetResponseStream();
			StreamReader reader = new StreamReader(dataStream);
			string responseFromServer = reader.ReadToEnd();
			reader.Close();

			// Return the string in the form of the TideData class
			return JsonConvert.DeserializeObject<AlertLevel>(responseFromServer);
		}

		public string getFormattedDate(string datetime)
		{
			// Parse the datetime from the original form to a more readable form
			DateTime dateTime = DateTime.ParseExact(datetime, "yyyyMMddHHmm", null);	
			return dateTime.ToString("dd/MM/yyyy h:mm tt");
		}

	}
	public class TideData
	{
		public string datetime { get; set; }
		public float water_level { get; set; }		
	}

    public class AlertLevel { 
		public int alert_level { get; set; }
	}
}
