using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
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
	/// Interaction logic for Window2.xaml
	/// </summary>
	public partial class Window2 : Window
	{
		public Window2(string site_data)
		{
			InitializeComponent();
			test_block.Text = site_data;
			SiteData[] site_list = JsonConvert.DeserializeObject<SiteData[]>(site_data);
			
			
		}
	}


	public class SiteData
	{
		public bool brisbane_bar { get; set; }
		public bool southport { get; set; }
		public bool mooloolaba { get; set; }
	}

}
